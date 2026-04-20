export type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

export type ExpenseFormData = Omit<Expense, 'id' | 'date'> & {
  date: string
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Other'
] as const

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

export type CollectionProductData = {
  produtoCodigo?: string
  codigo?: string
  nome: string
  preco: number
  imagens: { url: string; createdAt?: string }[]
  departamento?: { id?: number; nome: string }
  categoria?: { id?: number; nome: string }
  ordem?: number
  createdAt?: string
}