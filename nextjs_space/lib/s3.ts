import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3 = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
) {
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { uploadUrl, cloud_storage_path };
}

export async function getFileUrl(cloud_storage_path: string, isPublic: boolean) {
  if (isPublic) {
    const region = process.env.AWS_REGION ?? 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: 'attachment',
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string) {
  const command = new DeleteObjectCommand({ Bucket: bucketName, Key: cloud_storage_path });
  await s3.send(command);
}

export async function uploadBuffer(
  buffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  isPublic: boolean = true
) {
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;
  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: cloud_storage_path,
    Body: buffer,
    ContentType: contentType,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  };
  await s3.send(new PutObjectCommand(params));
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const url = isPublic
    ? `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`
    : cloud_storage_path;
  return { url, cloud_storage_path };
}
