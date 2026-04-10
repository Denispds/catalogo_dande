'use client';

import React from 'react';
import { MapPin, Phone, Mail, Clock, Building2 } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    handle: '@dandeacessorios',
    url: 'https://instagram.com/dandeacessorios',
    color: 'from-purple-500 via-pink-500 to-orange-400',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@dande.joias',
    url: 'https://www.tiktok.com/@dande.joias',
    color: 'from-gray-900 to-gray-800',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.76 1.49v-3.4a4.85 4.85 0 0 1-1-.07z"/>
      </svg>
    ),
  },
  {
    name: 'Pinterest',
    handle: 'dandevideosmkt',
    url: 'https://br.pinterest.com/dandevideosmkt/',
    color: 'from-red-600 to-red-500',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    handle: '(62) 99288-5251',
    url: 'https://wa.me/5562992885251',
    color: 'from-green-600 to-green-500',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
];

export default function CompanyInfo() {
  return (
    <section className="space-y-5">
      {/* Brand heading */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
          <span className="text-white font-bold text-lg">D</span>
        </div>
        <div>
          <h2 className="text-lg font-bold">Dande Acessórios</h2>
          <p className="text-xs text-muted-foreground">+14 anos de mercado em semijoias e acessórios</p>
        </div>
      </div>

      {/* Contact details */}
      <div className="rounded-2xl bg-card p-4 space-y-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium">Av. Honestino Guimarães, 897</p>
            <p className="text-[11px] text-muted-foreground">St. Campinas, Goiânia - GO, 74510-020</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Phone size={16} className="text-primary flex-shrink-0" />
          <div className="flex items-center gap-3">
            <a href="tel:+556232801471" className="text-xs font-medium hover:text-primary transition-colors">(62) 3280-1471</a>
            <a href="https://wa.me/5562992885251" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors">
              (62) 99288-5251
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Mail size={16} className="text-primary flex-shrink-0" />
          <a href="mailto:dandepersonalizado@gmail.com" className="text-xs font-medium hover:text-primary transition-colors">
            dandepersonalizado@gmail.com
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Clock size={16} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-medium">Seg-Sex: 09:00 - 18:00</p>
            <p className="text-[11px] text-muted-foreground">Sáb: 08:00 - 12:00</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Building2 size={16} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-medium">CNPJ: 44.756.890/0001-31</p>
            <p className="text-[11px] text-muted-foreground">
              <a href="https://www.dandejoias.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                www.dandejoias.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Social media links */}
      <div className="grid grid-cols-2 gap-2">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-card transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${social.color} flex items-center justify-center flex-shrink-0`}>
              {social.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold">{social.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{social.handle}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
