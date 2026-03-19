export type CategoryIconKey =
  | 'grid'
  | 'devices'
  | 'phone'
  | 'computer'
  | 'appliance'
  | 'kitchen'
  | 'furniture'
  | 'dress'
  | 'shirt'
  | 'shoe'
  | 'kids'
  | 'beauty'
  | 'sport'
  | 'auto'
  | 'tools'
  | 'pet'
  | 'books'
  | 'toys'
  | 'grocery'
  | 'garden'
  | 'jewelry'

export interface CategoryVisual {
  accent: string
  iconKey: CategoryIconKey
}

const iconMarkupByKey: Record<CategoryIconKey, string> = {
  grid: `
    <rect x="4" y="4" width="6" height="6" rx="1.5" />
    <rect x="14" y="4" width="6" height="6" rx="1.5" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" />
    <rect x="14" y="14" width="6" height="6" rx="1.5" />
  `,
  devices: `
    <rect x="5" y="6" width="9" height="12" rx="2.2" />
    <path d="M8 9.5h3" />
    <path d="M9.5 15.5h.01" />
    <rect x="16" y="9" width="3" height="6" rx="1.2" />
  `,
  phone: `
    <rect x="7" y="3.5" width="10" height="17" rx="2.4" />
    <path d="M10 6.8h4" />
    <path d="M12 17.2h.01" />
  `,
  computer: `
    <rect x="4" y="5" width="16" height="10" rx="2.2" />
    <path d="M9 19h6" />
    <path d="M12 15v4" />
  `,
  appliance: `
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <circle cx="12" cy="13" r="3.6" />
    <path d="M8 7h.01M12 7h.01M16 7h.01" />
  `,
  kitchen: `
    <path d="M7 4v8a2 2 0 0 0 4 0V4" />
    <path d="M17 4v16" />
    <path d="M15 8h4" />
    <path d="M9 16v4" />
    <path d="M17 16v4" />
  `,
  furniture: `
    <path d="M7 12V9.5A2.5 2.5 0 0 1 9.5 7h5A2.5 2.5 0 0 1 17 9.5V12" />
    <path d="M5 12h14v4H5z" />
    <path d="M7 16v4M17 16v4" />
  `,
  dress: `
    <path d="M10 4h4l1 3-1.8 2.2L16 20H8l2.8-10.8L9 7z" />
  `,
  shirt: `
    <path d="M9 5 12 3l3 2 3 2.5-2 3L14.5 9V20h-5V9L8 10.5l-2-3z" />
  `,
  shoe: `
    <path d="M5 15c2.8 0 4.4-1 5.8-3.3l2.2 1.3c1.2.7 2.2 1 4.6 1H20v3H5z" />
    <path d="M10.5 11.7V9.5" />
  `,
  kids: `
    <rect x="4" y="12" width="7" height="7" rx="1.6" />
    <rect x="13" y="5" width="7" height="7" rx="1.6" />
    <path d="M7.5 12V8.5h4" />
  `,
  beauty: `
    <rect x="7.5" y="4" width="5" height="8" rx="1.4" />
    <path d="M9 12h6v8H9z" />
    <path d="M15 8.5 18.5 5v10" />
  `,
  sport: `
    <path d="M3.5 9h3v6h-3zM17.5 9h3v6h-3z" />
    <path d="M6.5 10.5h2V13h-2zM15.5 10.5h2V13h-2z" />
    <path d="M8.5 12h7" />
  `,
  auto: `
    <path d="M5 14 7 9.5a2 2 0 0 1 1.8-1.2h6.4A2 2 0 0 1 17 9.5l2 4.5" />
    <path d="M4.5 14h15v3.5H4.5z" />
    <circle cx="8" cy="18" r="1.5" />
    <circle cx="16" cy="18" r="1.5" />
  `,
  tools: `
    <path d="M14.5 5.5a3 3 0 0 0 4 4L12 16l-4 4-2-2 4-4z" />
    <path d="M9 7 5 11" />
  `,
  pet: `
    <circle cx="8" cy="9" r="1.6" />
    <circle cx="12" cy="6.5" r="1.6" />
    <circle cx="16" cy="9" r="1.6" />
    <path d="M8.5 14.5c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5c0 1.7-1.3 3-3.5 3S8.5 16.2 8.5 14.5Z" />
  `,
  books: `
    <path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H18v16H8.5A2.5 2.5 0 0 0 6 21Z" />
    <path d="M6 5.5V21H4V8a2.5 2.5 0 0 1 2-2.5Z" />
    <path d="M10 7h5M10 11h5" />
  `,
  toys: `
    <path d="M8 6.5A2.5 2.5 0 0 1 12 5a2.5 2.5 0 0 1 4 1.5V9a2 2 0 0 1 2 2v3h-3a2 2 0 0 1-2 2v3h-2v-3a2 2 0 0 1-2-2H6v-3a2 2 0 0 1 2-2z" />
  `,
  grocery: `
    <path d="M6 9h12l-1.2 9H7.2z" />
    <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    <path d="M10 13h4" />
  `,
  garden: `
    <path d="M12 20c4.8-3.2 6.8-7 6.8-10.8A4.2 4.2 0 0 0 14.6 5C13 5 12 6.1 12 7.2 12 6.1 11 5 9.4 5A4.2 4.2 0 0 0 5.2 9.2C5.2 13 7.2 16.8 12 20Z" />
    <path d="M12 8v8" />
  `,
  jewelry: `
    <path d="M7 8 12 4l5 4-5 12z" />
    <path d="M7 8h10" />
  `,
}

const categoryVisualsBySlug: Record<string, CategoryVisual> = {
  'electronics-gadgets': { iconKey: 'devices', accent: '#d81f27' },
  'smartphones-accessories': { iconKey: 'phone', accent: '#f04e55' },
  'computers-office': { iconKey: 'computer', accent: '#b5171f' },
  'home-appliances': { iconKey: 'appliance', accent: '#97141a' },
  'home-kitchen': { iconKey: 'kitchen', accent: '#b4412c' },
  'furniture-interior': { iconKey: 'furniture', accent: '#5b2426' },
  'womens-clothing': { iconKey: 'dress', accent: '#d42d52' },
  'mens-clothing': { iconKey: 'shirt', accent: '#87131a' },
  footwear: { iconKey: 'shoe', accent: '#4a1b1f' },
  kids: { iconKey: 'kids', accent: '#ff6b60' },
  'beauty-care': { iconKey: 'beauty', accent: '#c52146' },
  'sports-leisure': { iconKey: 'sport', accent: '#8f161c' },
  auto: { iconKey: 'auto', accent: '#2f2a2b' },
  'tools-repair': { iconKey: 'tools', accent: '#d81f27' },
  'pet-supplies': { iconKey: 'pet', accent: '#7a1d30' },
  'stationery-books': { iconKey: 'books', accent: '#9a232b' },
  'toys-hobby': { iconKey: 'toys', accent: '#df5a40' },
  'groceries-drinks': { iconKey: 'grocery', accent: '#a61e22' },
  garden: { iconKey: 'garden', accent: '#7f3128' },
  'jewelry-accessories': { iconKey: 'jewelry', accent: '#8b2f23' },
}

const categoryAliases: Array<{ match: RegExp; slug: keyof typeof categoryVisualsBySlug }> = [
  { match: /электрон|гаджет/i, slug: 'electronics-gadgets' },
  { match: /смартфон|аксессуар/i, slug: 'smartphones-accessories' },
  { match: /компьютер|офис/i, slug: 'computers-office' },
  { match: /бытов/i, slug: 'home-appliances' },
  { match: /дом|кухн/i, slug: 'home-kitchen' },
  { match: /мебел|интерьер/i, slug: 'furniture-interior' },
  { match: /женск/i, slug: 'womens-clothing' },
  { match: /мужск/i, slug: 'mens-clothing' },
  { match: /обув/i, slug: 'footwear' },
  { match: /детск/i, slug: 'kids' },
  { match: /красот|уход/i, slug: 'beauty-care' },
  { match: /спорт|отдых/i, slug: 'sports-leisure' },
  { match: /авто/i, slug: 'auto' },
  { match: /инструмент|ремонт/i, slug: 'tools-repair' },
  { match: /зоотовар|питом/i, slug: 'pet-supplies' },
  { match: /канцтовар|книг/i, slug: 'stationery-books' },
  { match: /игрушк|хобби/i, slug: 'toys-hobby' },
  { match: /продукт|напит/i, slug: 'groceries-drinks' },
  { match: /сад|огород/i, slug: 'garden' },
  { match: /ювелир|аксессуар/i, slug: 'jewelry-accessories' },
]

export const defaultCategoryVisual: CategoryVisual = {
  iconKey: 'grid',
  accent: '#d81f27',
}

export const resolveCategoryVisual = (params: { slug?: string; name?: string; title?: string }) => {
  if (params.slug && categoryVisualsBySlug[params.slug]) {
    return categoryVisualsBySlug[params.slug]
  }

  const probe = [params.name, params.title].filter(Boolean).join(' ')
  const matched = categoryAliases.find((alias) => alias.match.test(probe))
  if (matched) {
    return categoryVisualsBySlug[matched.slug]
  }

  return defaultCategoryVisual
}

export const getCategoryIconMarkup = (iconKey: CategoryIconKey) => iconMarkupByKey[iconKey] ?? iconMarkupByKey.grid
