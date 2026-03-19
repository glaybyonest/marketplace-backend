import type { ProductSpecValue, ProductSpecs } from '@/types/domain'

const specLabels: Record<string, string> = {
  availability: 'Наличие',
  category: 'Категория',
  delivery: 'Доставка',
  fit: 'Стиль',
  fulfillment: 'Получение',
  room: 'Сценарий',
  season: 'Сезон',
  segment: 'Подборка',
  seller: 'Продавец',
  storage: 'Состояние',
  warranty: 'Гарантия',
}

const specValueLabels: Record<string, string> = {
  'all-season assortment': 'Всесезонная подборка',
  'best-value assortment': 'Выгодный ассортимент',
  'daily wear': 'На каждый день',
  'everyday grocery': 'Повседневные покупки',
  'fast delivery': 'Быстрая доставка',
  'flagship assortment': 'Флагманская линейка',
  'fresh marketplace stock': 'Свежая поставка',
  'home interior': 'Для интерьера',
  'marketplace assortment': 'Ассортимент витрины',
  'scheduled delivery': 'Доставка по расписанию',
}

const startCase = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export const formatProductSpecLabel = (key: string) => specLabels[key] ?? startCase(key)

export const formatProductSpecValue = (value: ProductSpecValue, key?: string) => {
  if (value === null) {
    return 'Не указано'
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return 'Не указано'
  }

  const availabilityMatch = trimmed.match(/^(\d+)\s+in stock$/i)
  if (availabilityMatch) {
    return `${availabilityMatch[1]} в наличии`
  }

  const warrantyMatch = trimmed.match(/^(\d+)\s+months?$/i)
  if (warrantyMatch) {
    return `${warrantyMatch[1]} мес.`
  }

  if (specValueLabels[trimmed]) {
    return specValueLabels[trimmed]
  }

  if (key === 'category' || key === 'seller') {
    return trimmed
  }

  return trimmed
}

export const getProductSpecEntries = (specs?: ProductSpecs, limit?: number) => {
  const entries = Object.entries(specs ?? {})

  if (typeof limit === 'number') {
    return entries.slice(0, limit)
  }

  return entries
}
