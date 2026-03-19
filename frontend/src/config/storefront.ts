export interface HeroSlide {
  id: string
  badge: string
  title: string
  description: string
  ctaLabel: string
  categorySlug?: string
  query?: string
  stat: string
  toneFrom: string
  toneTo: string
  accent: string
}

export interface PromoTile {
  id: string
  title: string
  description: string
  ctaLabel: string
  categorySlug?: string
  query?: string
  toneFrom: string
  toneTo: string
}

export interface StoryCard {
  id: string
  title: string
  subtitle: string
  note: string
  toneFrom: string
  toneTo: string
}

export interface UtilityLink {
  href: string
  label: string
}

export const utilityLinks: UtilityLink[] = [
  { href: '/', label: 'Стать продавцом' },
  { href: '/', label: 'Покупать для бизнеса' },
  { href: '/account/places', label: 'Мои адреса' },
  { href: '/account/orders', label: 'Заказы' },
]

export const heroSlides: HeroSlide[] = [
  {
    id: 'bulk-build',
    badge: 'Большая стройка',
    title: 'Маркетплейс для закупок в темпе Ozon',
    description:
      'Быстрый поиск по каталогу, плотная витрина, избранное, адреса доставки и checkout без отрыва от ваших backend-данных.',
    ctaLabel: 'Смотреть каталог',
    categorySlug: 'stroymaterialy',
    stat: '15+ SKU уже в seed-каталоге',
    toneFrom: '#0f7cff',
    toneTo: '#0051d8',
    accent: '#8fd2ff',
  },
  {
    id: 'cement',
    badge: 'Хиты по цементу',
    title: 'Подберите цемент и смеси за пару секунд',
    description:
      'Подсказки поиска, быстрые фильтры по цене и наличию и карточки товара с точной информацией о stock и unit.',
    ctaLabel: 'Открыть подборку',
    categorySlug: 'cement',
    query: 'цемент',
    stat: 'Подсказки и popular search уже подключены',
    toneFrom: '#1c9df8',
    toneTo: '#0077ff',
    accent: '#ffd76a',
  },
  {
    id: 'wood',
    badge: 'Пиломатериалы',
    title: 'Доска, брус, фанера и вагонка в одной витрине',
    description:
      'Секции на главной собираются из текущего каталога без CMS и остаются совместимыми с вашей существующей API-моделью.',
    ctaLabel: 'Перейти к товарам',
    categorySlug: 'pilomaterialy',
    stat: 'Статика витрины поверх текущего API',
    toneFrom: '#02a4ff',
    toneTo: '#0441b8',
    accent: '#ffd24a',
  },
]

export const promoTiles: PromoTile[] = [
  {
    id: 'fast-checkout',
    title: 'Быстрый checkout',
    description: 'Выберите сохранённый адрес и оформите заказ без лишних шагов.',
    ctaLabel: 'К checkout',
    toneFrom: '#0d63ff',
    toneTo: '#173fbf',
  },
  {
    id: 'nails',
    title: 'Крепёж и расходники',
    description: 'Соберите корзину мелочей через компактные карточки и быстрые действия.',
    ctaLabel: 'Выбрать крепёж',
    categorySlug: 'krepezh',
    toneFrom: '#f7f9ff',
    toneTo: '#e4edff',
  },
  {
    id: 'favorites',
    title: 'Избранное и рекомендации',
    description: 'Отложенные товары и персональные подборки уже встроены в текущий бэк.',
    ctaLabel: 'Смотреть витрину',
    toneFrom: '#f1f8ff',
    toneTo: '#d8e7ff',
  },
]

export const storyCards: StoryCard[] = [
  {
    id: 'delivery',
    title: 'Адреса доставки',
    subtitle: 'Сохраните несколько точек',
    note: 'Для checkout и повторных заказов',
    toneFrom: '#0c68ff',
    toneTo: '#004bca',
  },
  {
    id: 'search',
    title: 'Умный поиск',
    subtitle: 'Подсказки и популярные запросы',
    note: 'Работает на текущем `/search` API',
    toneFrom: '#eef7ff',
    toneTo: '#dceaff',
  },
  {
    id: 'sessions',
    title: 'Безопасные сессии',
    subtitle: 'Контроль устройств и logout-all',
    note: 'Подходит под cookie и token auth',
    toneFrom: '#f6f9ff',
    toneTo: '#e8eeff',
  },
  {
    id: 'admin',
    title: 'Admin backoffice',
    subtitle: 'Категории, товары и остатки',
    note: 'В том же visual language',
    toneFrom: '#eef5ff',
    toneTo: '#dbe6ff',
  },
]

export const categoryVisuals: Record<string, { icon: string; accent: string }> = {
  stroymaterialy: { icon: 'SM', accent: '#0f7cff' },
  cement: { icon: 'ЦМ', accent: '#005bff' },
  pilomaterialy: { icon: 'ПМ', accent: '#1e40ff' },
  oak: { icon: 'ДУ', accent: '#7c5d0f' },
  aspen: { icon: 'ОС', accent: '#0ea5e9' },
  birch: { icon: 'БР', accent: '#22c55e' },
  krepezh: { icon: 'КР', accent: '#f97316' },
  nails: { icon: 'ГВ', accent: '#fb7185' },
}

export const campaignBanner = {
  title: 'Новый storefront уже работает с вашим backend',
  description:
    'Каталог, поиск, карточка товара, корзина, checkout, auth, аккаунт и admin остаются на тех же маршрутах и API.',
}
