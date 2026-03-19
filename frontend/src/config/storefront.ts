export interface UtilityLink {
  href: string
  label: string
}

export const utilityLinks: UtilityLink[] = [
  { href: '/seller', label: 'Продавать на площадке' },
  { href: '/favorites', label: 'Избранное' },
  { href: '/account/places', label: 'Адреса' },
  { href: '/account/orders', label: 'Заказы' },
]
