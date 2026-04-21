export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} jam ${mins} menit`
}
