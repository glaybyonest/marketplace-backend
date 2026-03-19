export const formatCurrency = (value: number, currency = 'RUB') =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))

const UNIT_LABELS: Record<string, string> = {
  piece: 'шт.',
  pieces: 'шт.',
  item: 'шт.',
  items: 'шт.',
  unit: 'шт.',
  units: 'шт.',
  pc: 'шт.',
  pcs: 'шт.',
}

export const formatUnitLabel = (value?: string | null) => {
  const normalized = value?.trim()
  if (!normalized) {
    return ''
  }

  return UNIT_LABELS[normalized.toLowerCase()] ?? normalized
}
