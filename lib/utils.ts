export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function daysSince(date: string): number {
  const submitted = new Date(date)
  const now = new Date()
  return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
}
