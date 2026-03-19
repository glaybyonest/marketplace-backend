import type { CartItem, Product, SellerProfile } from '@/types/domain'
import { formatCurrency } from '@/utils/format'
import { getCategoryIconMarkup, resolveCategoryVisual } from '@/utils/categoryIcons'

type ManagedMediaKind = 'product' | 'seller-logo' | 'seller-banner'

interface ManagedMediaRef {
  kind: ManagedMediaKind
  seed: string
  variant: string
}

interface MediaOptions {
  kind?: ManagedMediaKind
  seed?: string
  title?: string
  subtitle?: string
  badges?: string[]
  price?: number
  currency?: string
  stock?: number
  categoryName?: string
  sku?: string
}

interface Palette {
  backgroundStart: string
  backgroundEnd: string
  panel: string
  accent: string
  accentSoft: string
  glow: string
  text: string
  textMuted: string
}

const MANAGED_MEDIA_PROTOCOL = 'marketplace-media://'
const EXTERNAL_PLACEHOLDER_PATTERN = /^https?:\/\/(?:placehold\.co|loremflickr\.com)\//i
const PRODUCT_GALLERY_VARIANTS = ['hero', 'detail', 'lifestyle'] as const

const palettes: Palette[] = [
  {
    backgroundStart: '#12090b',
    backgroundEnd: '#d81f27',
    panel: '#0d0708',
    accent: '#ff9ca0',
    accentSoft: '#ffe3e5',
    glow: '#ff6169',
    text: '#fff7f7',
    textMuted: '#f7c9cc',
  },
  {
    backgroundStart: '#1a1012',
    backgroundEnd: '#9f151c',
    panel: '#0c0809',
    accent: '#ffc2c5',
    accentSoft: '#fff0f1',
    glow: '#f87171',
    text: '#fff7f7',
    textMuted: '#f4c4c7',
  },
  {
    backgroundStart: '#101012',
    backgroundEnd: '#7e1318',
    panel: '#09090a',
    accent: '#ffd1c2',
    accentSoft: '#fff1ea',
    glow: '#ff7d57',
    text: '#fff7f4',
    textMuted: '#ffd0c2',
  },
  {
    backgroundStart: '#180d12',
    backgroundEnd: '#5d0f18',
    panel: '#10070c',
    accent: '#ffb0be',
    accentSoft: '#ffe8ee',
    glow: '#f14668',
    text: '#fff5f8',
    textMuted: '#f7c7d2',
  },
  {
    backgroundStart: '#141414',
    backgroundEnd: '#8e1c23',
    panel: '#09090a',
    accent: '#ffb8b3',
    accentSoft: '#fff0ee',
    glow: '#ff7467',
    text: '#fff7f6',
    textMuted: '#f3cbc8',
  },
  {
    backgroundStart: '#1b0c0d',
    backgroundEnd: '#2a2a2a',
    panel: '#0c0909',
    accent: '#ff9ea1',
    accentSoft: '#ffe7e8',
    glow: '#ff5058',
    text: '#fff8f8',
    textMuted: '#edc3c5',
  },
]

const hashString = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getPalette = (seed: string) => palettes[hashString(seed) % palettes.length]

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const trimText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

const splitLines = (value: string, maxLength: number, maxLines: number) => {
  const clean = value.trim()
  if (!clean) {
    return []
  }

  const words = clean.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxLength) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(trimText(word, maxLength))
      current = ''
    }

    if (lines.length === maxLines - 1) {
      const remainder = [current, ...words.slice(words.indexOf(word) + 1)].filter(Boolean).join(' ')
      if (remainder) {
        lines.push(trimText(remainder, maxLength))
      }
      return lines.slice(0, maxLines)
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, maxLines)
}

const encodeSvg = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const normalizeBadges = (badges: Array<string | undefined>) =>
  Array.from(
    new Set(
      badges
        .map((badge) => badge?.trim())
        .filter((badge): badge is string => Boolean(badge)),
    ),
  ).slice(0, 3)

const parseManagedMediaRef = (value: string): ManagedMediaRef | null => {
  if (!value.startsWith(MANAGED_MEDIA_PROTOCOL)) {
    return null
  }

  const rawPath = value.slice(MANAGED_MEDIA_PROTOCOL.length)
  const parts = rawPath.split('/').filter(Boolean)

  if (parts[0] === 'product') {
    return {
      kind: 'product',
      seed: parts[1] ?? 'product',
      variant: parts[2] ?? 'hero',
    }
  }

  if (parts[0] === 'seller') {
    const variant = parts[2] ?? 'banner'
    return {
      kind: variant === 'logo' ? 'seller-logo' : 'seller-banner',
      seed: parts[1] ?? 'seller',
      variant,
    }
  }

  return null
}

const shouldUseManagedMedia = (value?: string) => {
  if (!value) {
    return true
  }
  return value.startsWith(MANAGED_MEDIA_PROTOCOL) || EXTERNAL_PLACEHOLDER_PATTERN.test(value)
}

export const isGeneratedMediaSource = (value?: string) => {
  if (!value) {
    return false
  }
  return value.startsWith(MANAGED_MEDIA_PROTOCOL) || EXTERNAL_PLACEHOLDER_PATTERN.test(value)
}

type ProductVisualKind =
  | 'phone'
  | 'laptop'
  | 'audio'
  | 'camera'
  | 'gaming'
  | 'router'
  | 'appliance'
  | 'furniture'
  | 'fashion'
  | 'shoe'
  | 'beauty'
  | 'bag'
  | 'book'
  | 'food'
  | 'tool'
  | 'pet'
  | 'sports'
  | 'jewelry'
  | 'baby'
  | 'auto'
  | 'generic'

const containsKeyword = (value: string, keywords: string[]) => keywords.some((keyword) => value.includes(keyword))

const detectProductVisualKind = (title: string, categoryName?: string): ProductVisualKind => {
  const source = `${title} ${categoryName ?? ''}`.toLowerCase()

  if (containsKeyword(source, ['смартфон', 'телефон', 'iphone', 'android', 'планшет', 'электронная книга'])) {
    return 'phone'
  }
  if (containsKeyword(source, ['ноутбук', 'ультрабук', 'моноблок', 'системный блок', 'монитор', 'телевизор'])) {
    return 'laptop'
  }
  if (containsKeyword(source, ['наушники', 'гарнитура', 'колонка', 'акустика', 'микрофон'])) {
    return 'audio'
  }
  if (containsKeyword(source, ['камера', 'фотоаппарат', 'видеокамера', 'видеорегистратор', 'веб-камера'])) {
    return 'camera'
  }
  if (containsKeyword(source, ['консоль', 'джойстик', 'геймпад', 'vr'])) {
    return 'gaming'
  }
  if (containsKeyword(source, ['роутер', 'wi-fi', 'усилитель', 'адаптер', 'хаб', 'usb', 'ssd', 'флешка'])) {
    return 'router'
  }
  if (containsKeyword(source, ['холодильник', 'стираль', 'микроволнов', 'чайник', 'кофемаш', 'блендер', 'пылесос', 'вентилятор', 'кондиционер'])) {
    return 'appliance'
  }
  if (containsKeyword(source, ['диван', 'кресло', 'пуф', 'стол', 'стул', 'шкаф', 'комод', 'кровать', 'лампа', 'люстра', 'торшер'])) {
    return 'furniture'
  }
  if (containsKeyword(source, ['футболка', 'майка', 'рубашка', 'худи', 'свитер', 'кардиган', 'пиджак', 'брюки', 'джинсы', 'куртка', 'пуховик', 'платье', 'юбка'])) {
    return 'fashion'
  }
  if (containsKeyword(source, ['кроссовки', 'кеды', 'ботинки', 'туфли', 'сапоги', 'лоферы', 'сланцы', 'сандалии', 'босоножки', 'тапочки'])) {
    return 'shoe'
  }
  if (containsKeyword(source, ['шампунь', 'крем', 'сыворотка', 'маска', 'бальзам', 'духи', 'помада', 'лак', 'гель', 'дезодорант', 'паста'])) {
    return 'beauty'
  }
  if (containsKeyword(source, ['сумка', 'рюкзак', 'клатч', 'чемодан', 'кошелек', 'портмоне', 'косметичка'])) {
    return 'bag'
  }
  if (containsKeyword(source, ['книга', 'тетрадь', 'блокнот', 'ежедневник', 'учебник', 'комикс', 'энциклопедия', 'словарь', 'альбом'])) {
    return 'book'
  }
  if (containsKeyword(source, ['вода', 'сок', 'чай', 'кофе', 'молоко', 'йогурт', 'сыр', 'хлеб', 'рис', 'макароны', 'печенье', 'шоколад', 'джем', 'мед'])) {
    return 'food'
  }
  if (containsKeyword(source, ['дрель', 'шуруповерт', 'перфоратор', 'лобзик', 'пила', 'молоток', 'отверт', 'рулетка', 'уровень', 'ключ', 'болгарка'])) {
    return 'tool'
  }
  if (containsKeyword(source, ['корм', 'лежанка', 'когтеточка', 'лоток', 'ошейник', 'поводок', 'переноска', 'аквариум', 'террариум'])) {
    return 'pet'
  }
  if (containsKeyword(source, ['гантели', 'гири', 'йога', 'скакалка', 'палатка', 'велосипед', 'самокат', 'ролики', 'скейт', 'мяч', 'ракетка', 'лыжи', 'сноуборд'])) {
    return 'sports'
  }
  if (containsKeyword(source, ['кольцо', 'серьги', 'подвеска', 'цепочка', 'браслет', 'брошь', 'колье', 'чокер', 'запонки'])) {
    return 'jewelry'
  }
  if (containsKeyword(source, ['подгузники', 'бутылочка', 'соска', 'кроватка', 'коляска', 'автокресло', 'боди', 'ползунки', 'манеж', 'радионяня', 'видеоняня'])) {
    return 'baby'
  }
  if (containsKeyword(source, ['аккумулятор', 'масло', 'компрессор', 'магнитола', 'парктроник', 'домкрат', 'коврики автомобильные', 'видеорегистратор', 'на сиденье'])) {
    return 'auto'
  }

  return 'generic'
}

const renderProductIllustration = (kind: ProductVisualKind, palette: Palette, variant: string, seed: string) => {
  const shiftX = (hashString(`${seed}:${variant}:x`) % 36) - 18
  const shiftY = (hashString(`${seed}:${variant}:y`) % 28) - 14
  const scale = variant === 'detail' ? 1.06 : variant === 'lifestyle' ? 0.94 : 1
  const transform = `translate(${shiftX} ${shiftY}) scale(${scale})`

  const snippets: Record<ProductVisualKind, string> = {
    phone: `
      <g transform="${transform}">
        <ellipse cx="602" cy="900" rx="188" ry="42" fill="${palette.panel}" opacity="0.18" />
        <rect x="468" y="256" width="268" height="500" rx="56" fill="${palette.panel}" opacity="0.92" />
        <rect x="486" y="278" width="232" height="456" rx="42" fill="url(#screen)" />
        <rect x="556" y="238" width="92" height="16" rx="8" fill="${palette.textMuted}" opacity="0.55" />
        <circle cx="602" cy="704" r="12" fill="${palette.panel}" opacity="0.42" />
      </g>
    `,
    laptop: `
      <g transform="${transform}">
        <ellipse cx="610" cy="912" rx="248" ry="46" fill="${palette.panel}" opacity="0.18" />
        <rect x="390" y="278" width="440" height="288" rx="28" fill="${palette.panel}" opacity="0.96" />
        <rect x="418" y="304" width="384" height="236" rx="20" fill="url(#screen)" />
        <path d="M328 662H892L826 768H394L328 662Z" fill="${palette.accentSoft}" opacity="0.92" />
        <rect x="548" y="706" width="124" height="18" rx="9" fill="${palette.panel}" opacity="0.18" />
      </g>
    `,
    audio: `
      <g transform="${transform}">
        <ellipse cx="600" cy="912" rx="210" ry="42" fill="${palette.panel}" opacity="0.18" />
        <path d="M472 370C472 278 524 218 600 218C676 218 728 278 728 370" stroke="${palette.accentSoft}" stroke-width="44" stroke-linecap="round" />
        <rect x="430" y="352" width="92" height="214" rx="38" fill="${palette.accentSoft}" opacity="0.95" />
        <rect x="678" y="352" width="92" height="214" rx="38" fill="${palette.accentSoft}" opacity="0.95" />
        <circle cx="476" cy="454" r="42" fill="${palette.panel}" opacity="0.22" />
        <circle cx="724" cy="454" r="42" fill="${palette.panel}" opacity="0.22" />
      </g>
    `,
    camera: `
      <g transform="${transform}">
        <ellipse cx="598" cy="908" rx="208" ry="40" fill="${palette.panel}" opacity="0.18" />
        <rect x="386" y="388" width="424" height="248" rx="42" fill="${palette.accentSoft}" opacity="0.95" />
        <rect x="450" y="350" width="110" height="62" rx="20" fill="${palette.accent}" opacity="0.9" />
        <circle cx="610" cy="512" r="94" fill="${palette.panel}" opacity="0.82" />
        <circle cx="610" cy="512" r="54" fill="${palette.accentSoft}" opacity="0.9" />
        <circle cx="742" cy="454" r="16" fill="${palette.panel}" opacity="0.55" />
      </g>
    `,
    gaming: `
      <g transform="${transform}">
        <ellipse cx="600" cy="914" rx="226" ry="40" fill="${palette.panel}" opacity="0.18" />
        <path d="M394 520C394 430 460 374 548 374H652C740 374 806 430 806 520V582C806 640 768 688 712 704L638 726L600 676L562 726L488 704C432 688 394 640 394 582V520Z" fill="${palette.accentSoft}" opacity="0.96" />
        <circle cx="520" cy="540" r="32" fill="${palette.panel}" opacity="0.22" />
        <circle cx="694" cy="520" r="16" fill="${palette.panel}" opacity="0.22" />
        <circle cx="730" cy="556" r="16" fill="${palette.panel}" opacity="0.22" />
        <rect x="502" y="526" width="36" height="12" rx="6" fill="${palette.panel}" opacity="0.2" />
        <rect x="514" y="514" width="12" height="36" rx="6" fill="${palette.panel}" opacity="0.2" />
      </g>
    `,
    router: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="198" ry="36" fill="${palette.panel}" opacity="0.18" />
        <rect x="398" y="544" width="404" height="118" rx="30" fill="${palette.accentSoft}" opacity="0.96" />
        <rect x="454" y="492" width="20" height="88" rx="10" fill="${palette.panel}" opacity="0.54" />
        <rect x="570" y="460" width="20" height="120" rx="10" fill="${palette.panel}" opacity="0.54" />
        <rect x="692" y="492" width="20" height="88" rx="10" fill="${palette.panel}" opacity="0.54" />
        <circle cx="476" cy="604" r="10" fill="${palette.panel}" opacity="0.24" />
        <circle cx="514" cy="604" r="10" fill="${palette.panel}" opacity="0.24" />
        <circle cx="552" cy="604" r="10" fill="${palette.panel}" opacity="0.24" />
      </g>
    `,
    appliance: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="220" ry="40" fill="${palette.panel}" opacity="0.16" />
        <rect x="420" y="274" width="360" height="504" rx="48" fill="${palette.accentSoft}" opacity="0.96" />
        <rect x="460" y="326" width="280" height="320" rx="28" fill="${palette.text}" opacity="0.58" />
        <circle cx="600" cy="486" r="82" fill="${palette.panel}" opacity="0.18" />
        <circle cx="600" cy="486" r="42" fill="${palette.accent}" opacity="0.48" />
        <rect x="478" y="700" width="244" height="18" rx="9" fill="${palette.panel}" opacity="0.16" />
      </g>
    `,
    furniture: `
      <g transform="${transform}">
        <ellipse cx="600" cy="930" rx="236" ry="40" fill="${palette.panel}" opacity="0.16" />
        <rect x="406" y="428" width="388" height="168" rx="44" fill="${palette.accentSoft}" opacity="0.95" />
        <rect x="440" y="314" width="320" height="160" rx="42" fill="${palette.accent}" opacity="0.76" />
        <rect x="458" y="588" width="22" height="168" rx="11" fill="${palette.panel}" opacity="0.34" />
        <rect x="720" y="588" width="22" height="168" rx="11" fill="${palette.panel}" opacity="0.34" />
        <rect x="520" y="588" width="22" height="168" rx="11" fill="${palette.panel}" opacity="0.28" />
        <rect x="658" y="588" width="22" height="168" rx="11" fill="${palette.panel}" opacity="0.28" />
      </g>
    `,
    fashion: `
      <g transform="${transform}">
        <ellipse cx="600" cy="922" rx="182" ry="34" fill="${palette.panel}" opacity="0.16" />
        <path d="M520 296L600 256L680 296L744 418L666 462L638 390V760H562V390L534 462L456 418L520 296Z" fill="${palette.accentSoft}" opacity="0.96" />
        <path d="M562 390H638V760H562V390Z" fill="${palette.accent}" opacity="0.44" />
      </g>
    `,
    shoe: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="224" ry="34" fill="${palette.panel}" opacity="0.16" />
        <path d="M420 640C470 612 506 560 540 492L658 564C706 594 772 616 816 642V714H420V640Z" fill="${palette.accentSoft}" opacity="0.98" />
        <path d="M438 680H794" stroke="${palette.panel}" stroke-width="16" stroke-linecap="round" opacity="0.18" />
        <path d="M560 560L618 590M530 600L606 628M500 638L594 664" stroke="${palette.panel}" stroke-width="12" stroke-linecap="round" opacity="0.18" />
      </g>
    `,
    beauty: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="196" ry="36" fill="${palette.panel}" opacity="0.16" />
        <rect x="510" y="280" width="180" height="420" rx="40" fill="${palette.accentSoft}" opacity="0.95" />
        <rect x="544" y="226" width="112" height="82" rx="22" fill="${palette.panel}" opacity="0.24" />
        <rect x="470" y="628" width="116" height="116" rx="28" fill="${palette.text}" opacity="0.6" />
        <rect x="614" y="610" width="124" height="138" rx="34" fill="${palette.accent}" opacity="0.56" />
      </g>
    `,
    bag: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="206" ry="38" fill="${palette.panel}" opacity="0.16" />
        <rect x="438" y="360" width="324" height="360" rx="48" fill="${palette.accentSoft}" opacity="0.96" />
        <path d="M520 404C520 330 552 286 600 286C648 286 680 330 680 404" stroke="${palette.panel}" stroke-width="24" stroke-linecap="round" opacity="0.32" />
        <rect x="500" y="450" width="200" height="28" rx="14" fill="${palette.panel}" opacity="0.14" />
      </g>
    `,
    book: `
      <g transform="${transform}">
        <ellipse cx="600" cy="924" rx="210" ry="34" fill="${palette.panel}" opacity="0.16" />
        <path d="M408 332C408 304 430 282 458 282H690C714 282 734 302 736 326L756 772C758 800 736 822 708 822H474C446 822 424 802 422 774L408 332Z" fill="${palette.accentSoft}" opacity="0.96" />
        <path d="M724 322L744 770C746 790 730 808 710 808H492L476 296H688C708 296 722 308 724 322Z" fill="${palette.text}" opacity="0.42" />
        <rect x="520" y="346" width="168" height="18" rx="9" fill="${palette.panel}" opacity="0.14" />
        <rect x="520" y="394" width="206" height="18" rx="9" fill="${palette.panel}" opacity="0.12" />
      </g>
    `,
    food: `
      <g transform="${transform}">
        <ellipse cx="600" cy="924" rx="196" ry="34" fill="${palette.panel}" opacity="0.16" />
        <path d="M478 314H722L694 772H506L478 314Z" fill="${palette.accentSoft}" opacity="0.96" />
        <rect x="510" y="364" width="180" height="182" rx="34" fill="${palette.text}" opacity="0.54" />
        <rect x="542" y="596" width="116" height="22" rx="11" fill="${palette.panel}" opacity="0.16" />
      </g>
    `,
    tool: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="214" ry="36" fill="${palette.panel}" opacity="0.16" />
        <path d="M424 598L608 414C650 372 718 372 760 414L786 440C818 472 818 524 786 556L602 740L424 598Z" fill="${palette.accentSoft}" opacity="0.96" />
        <rect x="370" y="618" width="190" height="80" rx="28" fill="${palette.accent}" opacity="0.58" transform="rotate(-24 370 618)" />
      </g>
    `,
    pet: `
      <g transform="${transform}">
        <ellipse cx="600" cy="922" rx="206" ry="36" fill="${palette.panel}" opacity="0.16" />
        <path d="M456 344H744L710 776H490L456 344Z" fill="${palette.accentSoft}" opacity="0.96" />
        <circle cx="552" cy="500" r="44" fill="${palette.panel}" opacity="0.16" />
        <circle cx="648" cy="500" r="44" fill="${palette.panel}" opacity="0.16" />
        <circle cx="600" cy="438" r="46" fill="${palette.panel}" opacity="0.16" />
        <circle cx="560" cy="540" r="18" fill="${palette.panel}" opacity="0.18" />
        <circle cx="640" cy="540" r="18" fill="${palette.panel}" opacity="0.18" />
        <circle cx="600" cy="578" r="18" fill="${palette.panel}" opacity="0.18" />
      </g>
    `,
    sports: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="218" ry="36" fill="${palette.panel}" opacity="0.16" />
        <circle cx="510" cy="546" r="98" fill="${palette.accentSoft}" opacity="0.96" />
        <path d="M448 492C480 520 500 562 510 644M572 492C540 520 520 562 510 644M424 550H596" stroke="${palette.panel}" stroke-width="14" stroke-linecap="round" opacity="0.16" />
        <rect x="620" y="418" width="74" height="232" rx="26" fill="${palette.accent}" opacity="0.64" />
        <rect x="708" y="418" width="74" height="232" rx="26" fill="${palette.accent}" opacity="0.64" />
        <rect x="642" y="492" width="118" height="86" rx="26" fill="${palette.accentSoft}" opacity="0.96" />
      </g>
    `,
    jewelry: `
      <g transform="${transform}">
        <ellipse cx="600" cy="924" rx="180" ry="30" fill="${palette.panel}" opacity="0.16" />
        <circle cx="600" cy="548" r="146" stroke="${palette.accentSoft}" stroke-width="42" opacity="0.96" />
        <circle cx="600" cy="548" r="86" fill="${palette.text}" opacity="0.2" />
        <rect x="554" y="338" width="92" height="92" rx="24" fill="${palette.accent}" opacity="0.78" transform="rotate(45 554 338)" />
      </g>
    `,
    baby: `
      <g transform="${transform}">
        <ellipse cx="600" cy="924" rx="216" ry="36" fill="${palette.panel}" opacity="0.16" />
        <path d="M454 666C454 542 536 454 646 454H702C748 454 786 492 786 538V664H454V666Z" fill="${palette.accentSoft}" opacity="0.96" />
        <circle cx="556" cy="772" r="52" fill="${palette.panel}" opacity="0.18" />
        <circle cx="724" cy="772" r="52" fill="${palette.panel}" opacity="0.18" />
        <path d="M704 404C704 338 652 286 584 286" stroke="${palette.panel}" stroke-width="24" stroke-linecap="round" opacity="0.28" />
      </g>
    `,
    auto: `
      <g transform="${transform}">
        <ellipse cx="600" cy="924" rx="232" ry="36" fill="${palette.panel}" opacity="0.16" />
        <path d="M416 624L468 494C484 456 520 430 562 430H676C718 430 754 456 770 494L824 624V694H416V624Z" fill="${palette.accentSoft}" opacity="0.96" />
        <circle cx="500" cy="694" r="52" fill="${palette.panel}" opacity="0.22" />
        <circle cx="740" cy="694" r="52" fill="${palette.panel}" opacity="0.22" />
        <rect x="490" y="500" width="220" height="68" rx="24" fill="${palette.text}" opacity="0.34" />
      </g>
    `,
    generic: `
      <g transform="${transform}">
        <ellipse cx="600" cy="920" rx="210" ry="34" fill="${palette.panel}" opacity="0.16" />
        <rect x="432" y="338" width="336" height="336" rx="42" fill="${palette.accentSoft}" opacity="0.96" />
        <rect x="486" y="392" width="228" height="96" rx="28" fill="${palette.text}" opacity="0.44" />
        <rect x="486" y="518" width="174" height="28" rx="14" fill="${palette.panel}" opacity="0.14" />
        <rect x="486" y="568" width="142" height="28" rx="14" fill="${palette.panel}" opacity="0.12" />
      </g>
    `,
  }

  return snippets[kind]
}

const renderProductSvg = (
  seed: string,
  variant: string,
  title: string,
  subtitle: string,
  badges: string[],
  options: Pick<MediaOptions, 'categoryName' | 'price' | 'currency' | 'stock' | 'sku'>,
) => {
  const palette = getPalette(`${seed}:${variant}`)
  const titleLines = splitLines(title, 22, 2)
  const categoryVisual = resolveCategoryVisual({ name: options.categoryName || badges[0], title })
  const variantLabel = variant === 'detail' ? 'Детали' : variant === 'lifestyle' ? 'Подборка' : 'Хит'
  const lowerCopy = trimText(subtitle || badges[1] || 'Подобрано для витрины', 34)
  const priceLabel = options.price !== undefined ? formatCurrency(options.price, options.currency) : 'Актуальная цена'
  const stockLabel =
    typeof options.stock === 'number' ? (options.stock > 0 ? `${options.stock} в наличии` : 'Под заказ') : 'Уточняйте остаток'
  const skuLabel = trimText(options.sku ? `Артикул ${options.sku}` : 'Карточка товара', 22)
  const featureLine = trimText(options.categoryName || badges[0] || 'Каталог', 18)
  const iconMarkup = getCategoryIconMarkup(categoryVisual.iconKey)
  const badgeTitle = trimText(options.categoryName || badges[0] || 'Каталог', 20)
  const visualKind = detectProductVisualKind(title, options.categoryName)
  const illustrationMarkup = renderProductIllustration(visualKind, palette, variant, seed)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="1200" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.backgroundStart}" />
          <stop offset="1" stop-color="${palette.backgroundEnd}" />
        </linearGradient>
        <linearGradient id="stage" x1="180" y1="150" x2="1020" y2="880" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.text}" stop-opacity="0.18" />
          <stop offset="1" stop-color="${palette.accentSoft}" stop-opacity="0.12" />
        </linearGradient>
        <linearGradient id="screen" x1="486" y1="280" x2="718" y2="734" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.text}" stop-opacity="0.9" />
          <stop offset="1" stop-color="${palette.accentSoft}" stop-opacity="0.38" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="56" fill="url(#bg)" />
      <circle cx="968" cy="188" r="210" fill="${palette.glow}" opacity="0.22" />
      <circle cx="236" cy="1024" r="192" fill="${palette.accentSoft}" opacity="0.12" />
      <rect x="78" y="78" width="1044" height="808" rx="58" fill="url(#stage)" />
      <rect x="112" y="112" width="248" height="50" rx="25" fill="${palette.text}" opacity="0.12" />
      <text x="148" y="145" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="24" font-weight="700">${escapeXml(
        badgeTitle,
      )}</text>
      <rect x="940" y="112" width="148" height="50" rx="25" fill="${palette.text}" opacity="0.12" />
      <text x="1014" y="145" text-anchor="middle" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="23" font-weight="700">${escapeXml(
        trimText(variantLabel, 28),
      )}</text>
      ${illustrationMarkup}
      ${titleLines
        .map(
          (line, index) =>
            `<text x="120" y="${972 + index * 58}" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="46" font-weight="800">${escapeXml(
              line,
            )}</text>`,
        )
        .join('')}
      <text x="120" y="1090" fill="${palette.textMuted}" font-family="Manrope, Segoe UI, sans-serif" font-size="28" font-weight="600">${escapeXml(
        lowerCopy,
      )}</text>
      <rect x="82" y="900" width="1036" height="224" rx="44" fill="${palette.panel}" opacity="0.26" />
      <rect x="832" y="944" width="250" height="72" rx="24" fill="${palette.text}" opacity="0.12" />
      <text x="862" y="975" fill="${palette.textMuted}" font-family="Manrope, Segoe UI, sans-serif" font-size="18" font-weight="700">Цена</text>
      <text x="862" y="1006" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="32" font-weight="800">${escapeXml(
        trimText(priceLabel, 16),
      )}</text>
      <rect x="832" y="1032" width="250" height="58" rx="20" fill="${palette.text}" opacity="0.1" />
      <text x="862" y="1068" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="21" font-weight="700">${escapeXml(
        trimText(stockLabel, 20),
      )}</text>
      <rect x="120" y="930" width="224" height="56" rx="20" fill="${palette.text}" opacity="0.1" />
      <g transform="translate(148 946) scale(4.4)" stroke="${palette.text}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${iconMarkup}
      </g>
      <text x="206" y="968" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="22" font-weight="700">${escapeXml(
        featureLine,
      )}</text>
      <text x="120" y="1046" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="21" font-weight="700">${escapeXml(
        skuLabel,
      )}</text>
    </svg>
  `

  return encodeSvg(svg)
}

const renderSellerLogoSvg = (seed: string, title: string, subtitle: string) => {
  const palette = getPalette(`${seed}:logo`)
  const initials = escapeXml(getInitials(title) || 'MP')
  const label = escapeXml(trimText(subtitle || 'Магазин', 14))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.backgroundStart}" />
          <stop offset="1" stop-color="${palette.backgroundEnd}" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="56" fill="url(#bg)" />
      <circle cx="190" cy="52" r="52" fill="${palette.accent}" opacity="0.24" />
      <circle cx="60" cy="206" r="78" fill="${palette.accentSoft}" opacity="0.12" />
      <rect x="28" y="28" width="184" height="184" rx="42" fill="${palette.text}" opacity="0.08" />
      <text x="120" y="132" text-anchor="middle" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="76" font-weight="800">${initials}</text>
      <text x="120" y="188" text-anchor="middle" fill="${palette.textMuted}" font-family="Manrope, Segoe UI, sans-serif" font-size="20" font-weight="600">${label}</text>
    </svg>
  `

  return encodeSvg(svg)
}

const renderSellerBannerSvg = (seed: string, title: string, subtitle: string, badges: string[]) => {
  const palette = getPalette(`${seed}:banner`)
  const titleLines = splitLines(title, 26, 2)
  const supportLine = trimText(subtitle || 'Актуальный ассортимент и быстрая доставка по витрине', 60)
  const sellerBadges = normalizeBadges(badges)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 480" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1440" y2="480" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.backgroundStart}" />
          <stop offset="1" stop-color="${palette.backgroundEnd}" />
        </linearGradient>
      </defs>
      <rect width="1440" height="480" rx="42" fill="url(#bg)" />
      <circle cx="1240" cy="90" r="150" fill="${palette.accent}" opacity="0.2" />
      <circle cx="1370" cy="390" r="180" fill="${palette.accentSoft}" opacity="0.14" />
      <path d="M0 356C154 286 334 266 536 320C738 374 935 392 1440 244V480H0V356Z" fill="${palette.panel}" opacity="0.28" />
      <rect x="72" y="70" width="188" height="40" rx="20" fill="${palette.text}" opacity="0.12" />
      <text x="104" y="96" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="21" font-weight="700">Витрина магазина</text>
      ${titleLines
        .map(
          (line, index) =>
            `<text x="72" y="${178 + index * 72}" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="62" font-weight="800">${escapeXml(
              line,
            )}</text>`,
        )
        .join('')}
      <text x="72" y="308" fill="${palette.textMuted}" font-family="Manrope, Segoe UI, sans-serif" font-size="26" font-weight="500">${escapeXml(
        supportLine,
      )}</text>
      ${sellerBadges
        .map(
          (badge, index) => `
            <rect x="${72 + index * 226}" y="348" width="208" height="42" rx="21" fill="${palette.text}" opacity="0.14" />
            <text x="${104 + index * 226}" y="375" fill="${palette.text}" font-family="Manrope, Segoe UI, sans-serif" font-size="20" font-weight="700">${escapeXml(
              trimText(badge, 18),
            )}</text>
          `,
        )
        .join('')}
      <rect x="1018" y="84" width="252" height="312" rx="34" fill="${palette.text}" opacity="0.12" />
      <rect x="1060" y="128" width="168" height="18" rx="9" fill="${palette.text}" opacity="0.24" />
      <rect x="1060" y="166" width="130" height="18" rx="9" fill="${palette.text}" opacity="0.16" />
      <rect x="1060" y="214" width="168" height="128" rx="24" fill="${palette.text}" opacity="0.14" />
    </svg>
  `

  return encodeSvg(svg)
}

export const createManagedProductMediaRef = (
  slug: string,
  variant: (typeof PRODUCT_GALLERY_VARIANTS)[number] = 'hero',
) => `${MANAGED_MEDIA_PROTOCOL}product/${slug}/${variant}`

export const createManagedSellerLogoRef = (storeSlug: string) => `${MANAGED_MEDIA_PROTOCOL}seller/${storeSlug}/logo`

export const createManagedSellerBannerRef = (storeSlug: string) => `${MANAGED_MEDIA_PROTOCOL}seller/${storeSlug}/banner`

export const resolveMediaUrl = (value: string | undefined, options: MediaOptions = {}) => {
  if (value && !shouldUseManagedMedia(value)) {
    return value
  }

  const parsed = value ? parseManagedMediaRef(value) : null
  const kind = parsed?.kind ?? options.kind ?? 'product'
  const seed = parsed?.seed ?? options.seed ?? 'marketplace'
  const variant = parsed?.variant ?? 'hero'
  const title = options.title?.trim() || (kind === 'product' ? 'Товар каталога' : 'Магазин продавца')
  const subtitle = options.subtitle?.trim() || ''
  const badges = normalizeBadges(options.badges ?? [])

  if (kind === 'seller-logo') {
    return renderSellerLogoSvg(seed, title, subtitle || badges[0] || 'Магазин')
  }

  if (kind === 'seller-banner') {
    return renderSellerBannerSvg(seed, title, subtitle, badges)
  }

  return renderProductSvg(seed, variant, title, subtitle, badges, options)
}

export const resolveProductImage = (
  product: Pick<Product, 'id' | 'slug' | 'title' | 'brand' | 'categoryName' | 'sellerName' | 'imageUrl' | 'images' | 'price' | 'currency' | 'stock' | 'sku'>,
  index = 0,
  source?: string,
) => {
  const fallbackVariant = PRODUCT_GALLERY_VARIANTS[clamp(index, 0, PRODUCT_GALLERY_VARIANTS.length - 1)] ?? 'hero'
  const mediaSource =
    source ??
    product.images[index] ??
    product.imageUrl ??
    createManagedProductMediaRef(product.slug || product.id, fallbackVariant)
  return resolveMediaUrl(mediaSource, {
    kind: 'product',
    seed: product.slug || product.id || `product-${index}`,
    title: product.title,
    subtitle: product.sellerName || product.brand || product.categoryName || 'Товар каталога',
    badges: normalizeBadges([product.categoryName, product.brand, product.sellerName]),
    categoryName: product.categoryName,
    price: product.price,
    currency: product.currency,
    stock: product.stock,
    sku: product.sku,
  })
}

export const resolveCartItemImage = (
  item: Pick<CartItem, 'id' | 'productId' | 'slug' | 'title' | 'sellerName' | 'sku' | 'imageUrl' | 'price' | 'currency' | 'stock'>,
) =>
  resolveMediaUrl(item.imageUrl, {
    kind: 'product',
    seed: item.slug || item.productId || item.id,
    title: item.title,
    subtitle: item.sellerName || item.sku || 'Товар каталога',
    badges: normalizeBadges([item.sellerName, item.sku]),
    price: item.price,
    currency: item.currency,
    stock: item.stock,
    sku: item.sku,
  })

export const resolveSellerLogo = (
  profile: Pick<SellerProfile, 'storeSlug' | 'storeName' | 'city' | 'status' | 'logoUrl'>,
) =>
  resolveMediaUrl(profile.logoUrl, {
    kind: 'seller-logo',
    seed: profile.storeSlug || profile.storeName,
    title: profile.storeName,
    subtitle: profile.city || profile.status || 'Магазин',
  })

export const resolveSellerBanner = (
  profile: Pick<SellerProfile, 'storeSlug' | 'storeName' | 'city' | 'status' | 'description' | 'bannerUrl'>,
) =>
  resolveMediaUrl(profile.bannerUrl, {
    kind: 'seller-banner',
    seed: profile.storeSlug || profile.storeName,
    title: profile.storeName,
    subtitle: profile.description || profile.city || 'Витрина продавца',
    badges: normalizeBadges([profile.status, profile.city]),
  })
