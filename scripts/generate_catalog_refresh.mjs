import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'catalog_refresh_source.txt')
const previousMigrationPath = path.join(__dirname, '..', 'migrations', '00015_seller_marketplace_universalization.sql')
const outputPath = path.join(__dirname, '..', 'migrations', '00016_catalog_refresh.sql')

const legacyCategoryIDs = [
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111113',
  '11111111-1111-1111-1111-111111111114',
  '11111111-1111-1111-1111-111111111115',
  '11111111-1111-1111-1111-111111111116',
  '11111111-1111-1111-1111-111111111117',
  '11111111-1111-1111-1111-111111111118',
]

const legacyProductIDs = [
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222206',
  '22222222-2222-2222-2222-222222222207',
  '22222222-2222-2222-2222-222222222208',
  '22222222-2222-2222-2222-222222222209',
  '22222222-2222-2222-2222-222222222210',
  '22222222-2222-2222-2222-222222222211',
  '22222222-2222-2222-2222-222222222212',
  '22222222-2222-2222-2222-222222222213',
  '22222222-2222-2222-2222-222222222214',
  '22222222-2222-2222-2222-222222222215',
]

const sellers = {
  urbanwave: {
    id: '33333333-3333-3333-3333-333333333301',
    storeName: 'UrbanWave',
  },
  'casa-luna': {
    id: '33333333-3333-3333-3333-333333333302',
    storeName: 'Casa Luna',
  },
  'roam-fit': {
    id: '33333333-3333-3333-3333-333333333303',
    storeName: 'Roam & Fit',
  },
}

const categoryMeta = {
  'Электроника и гаджеты': { slug: 'electronics-gadgets', code: 'EL', imageTag: 'electronics', sellerKey: 'urbanwave', brands: ['UrbanWave', 'Voltix', 'Nexio', 'Auralink', 'PixelPort'], priceRange: [990, 19990], premiumRange: [24990, 159990], stockRange: [4, 46], delivery: '1-2 дня' },
  'Смартфоны и аксессуары': { slug: 'smartphones-accessories', code: 'SA', imageTag: 'smartphone', sellerKey: 'urbanwave', brands: ['UrbanWave', 'CasePort', 'Voltix', 'Snaply', 'SignalLab'], priceRange: [120, 7990], stockRange: [12, 120], delivery: 'сегодня или завтра' },
  'Компьютеры и офис': { slug: 'computers-office', code: 'CO', imageTag: 'office', sellerKey: 'urbanwave', brands: ['DeskPilot', 'UrbanWave', 'NodeCraft', 'OfficeCore', 'KeyFrame'], priceRange: [180, 14990], premiumRange: [12990, 189990], stockRange: [4, 68], delivery: '1-3 дня' },
  'Бытовая техника': { slug: 'home-appliances', code: 'HA', imageTag: 'appliance', sellerKey: 'casa-luna', brands: ['Casa Luna', 'HomeGrid', 'Nordline', 'DailySteam', 'KitchenAir'], priceRange: [790, 14990], premiumRange: [11990, 219990], stockRange: [2, 34], delivery: '2-5 дней' },
  'Дом и кухня': { slug: 'home-kitchen', code: 'HK', imageTag: 'kitchen', sellerKey: 'casa-luna', brands: ['Casa Luna', 'HomeGrid', 'TableCraft', 'SoftNest', 'Cooklane'], priceRange: [140, 6990], stockRange: [8, 96], delivery: '1-3 дня' },
  'Мебель и интерьер': { slug: 'furniture-interior', code: 'FI', imageTag: 'furniture', sellerKey: 'casa-luna', brands: ['Casa Luna', 'LoftHouse', 'Roomline', 'Urban Oak', 'Studio Form'], priceRange: [390, 19990], premiumRange: [6990, 149990], stockRange: [2, 18], delivery: '3-7 дней' },
  'Женская одежда': { slug: 'womens-clothing', code: 'WC', imageTag: 'fashion', sellerKey: 'roam-fit', brands: ['Modevera', 'Roam & Fit', 'Silktide', 'Lunette', 'Every Muse'], priceRange: [390, 6990], stockRange: [6, 72], delivery: '1-3 дня' },
  'Мужская одежда': { slug: 'mens-clothing', code: 'MC', imageTag: 'mensfashion', sellerKey: 'roam-fit', brands: ['Northline', 'Roam & Fit', 'Axis Wear', 'Stone Park', 'Tailor Run'], priceRange: [390, 7490], stockRange: [6, 72], delivery: '1-3 дня' },
  Обувь: { slug: 'footwear', code: 'FW', imageTag: 'shoes', sellerKey: 'roam-fit', brands: ['StrideLab', 'Roam & Fit', 'Stepmark', 'Cloud Sole', 'Northline'], priceRange: [490, 8990], stockRange: [5, 54], delivery: '1-3 дня' },
  'Детские товары': { slug: 'kids', code: 'KD', imageTag: 'baby', sellerKey: 'roam-fit', brands: ['TinySteps', 'Little Hub', 'Roam & Fit', 'Mini Bloom', 'Baby Trail'], priceRange: [180, 7990], premiumRange: [4990, 74990], stockRange: [6, 88], delivery: '1-3 дня' },
  'Красота и уход': { slug: 'beauty-care', code: 'BC', imageTag: 'beauty', sellerKey: 'roam-fit', brands: ['Veloura', 'Pureday', 'Roam & Fit', 'Skin Ritual', 'Gloss Lane'], priceRange: [120, 3990], stockRange: [10, 140], delivery: 'сегодня или завтра' },
  'Спорт и отдых': { slug: 'sports-leisure', code: 'SL', imageTag: 'fitness', sellerKey: 'roam-fit', brands: ['Roam & Fit', 'Trailmark', 'Peakmove', 'Corelift', 'Aqua Trek'], priceRange: [290, 9990], premiumRange: [6990, 159990], stockRange: [4, 56], delivery: '1-4 дня' },
  Автотовары: { slug: 'auto', code: 'AU', imageTag: 'car', sellerKey: 'urbanwave', brands: ['DriveMate', 'UrbanWave', 'Road Sync', 'Motorline', 'CarPort'], priceRange: [150, 8990], premiumRange: [4990, 34990], stockRange: [6, 64], delivery: '1-3 дня' },
  'Инструменты и ремонт': { slug: 'tools-repair', code: 'TR', imageTag: 'tools', sellerKey: 'casa-luna', brands: ['BuildCraft', 'Casa Luna', 'PowerGrid', 'Fixline', 'Prime Tool'], priceRange: [120, 7990], premiumRange: [2990, 79990], stockRange: [4, 52], delivery: '1-4 дня' },
  Зоотовары: { slug: 'pet-supplies', code: 'PT', imageTag: 'pets', sellerKey: 'roam-fit', brands: ['Pet House', 'Pawline', 'Roam & Fit', 'Tail Joy', 'Home Paws'], priceRange: [110, 4990], stockRange: [8, 110], delivery: '1-3 дня' },
  'Канцтовары и книги': { slug: 'stationery-books', code: 'SB', imageTag: 'books', sellerKey: 'roam-fit', brands: ['Paperlane', 'Book Nook', 'DeskPilot', 'Note Grid', 'Campus Line'], priceRange: [80, 2990], stockRange: [14, 180], delivery: 'сегодня или завтра' },
  'Игрушки и хобби': { slug: 'toys-hobby', code: 'TH', imageTag: 'toys', sellerKey: 'roam-fit', brands: ['Playverse', 'Craft Joy', 'Mini Orbit', 'Wonder Lab', 'Roam & Fit'], priceRange: [150, 5990], stockRange: [6, 96], delivery: '1-3 дня' },
  'Продукты и напитки': { slug: 'groceries-drinks', code: 'GD', imageTag: 'grocery', sellerKey: 'casa-luna', brands: ['Daily Basket', 'Casa Luna', 'Fresh Lane', 'Harvest Day', 'KitchenAir'], priceRange: [70, 890], stockRange: [16, 220], delivery: 'сегодня' },
  'Сад и огород': { slug: 'garden', code: 'GR', imageTag: 'garden', sellerKey: 'casa-luna', brands: ['Green Yard', 'Casa Luna', 'Harvest Pro', 'Garden Trail', 'Bloom Works'], priceRange: [140, 4990], premiumRange: [2990, 109990], stockRange: [5, 72], delivery: '2-5 дней' },
  'Ювелирные изделия и аксессуары': { slug: 'jewelry-accessories', code: 'JA', imageTag: 'jewelry', sellerKey: 'roam-fit', brands: ['Lunette', 'Aurelia', 'Roam & Fit', 'Silver Bloom', 'Atelier Ray'], priceRange: [190, 6990], premiumRange: [4990, 99990], stockRange: [4, 58], delivery: '1-3 дня' },
}

const translitMap = new Map(Object.entries({ а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }))

const expensiveMatchers = [/(смартфон|планшет|ноутбук|ультрабук|моноблок|системный блок|монитор|телевизор|фотоаппарат|видеокамера|vr-гарнитура|игровая консоль|мини-проектор|принтер|сканер|холодильник|морозильная камера|стиральная машина|сушильная машина|посудомоечная машина|духовой шкаф|варочная панель|электрическая плита|газовая плита|кофемашина|робот-пылесос|кондиционер|водонагреватель|электрокамин|диван|шкаф-купе|кровать|матрас|офисный ноутбук|проектор для офиса|маршрутизатор|сетевой коммутатор|ибп|видеокарта|процессор|материнская плата|велотренажер|беговая дорожка|эллиптический тренажер|велосипед|сноуборд|лыжи|доска для сап-серфинга|автокресло|коляска 2 в 1|коляска прогулочная|автомагнитола|сабвуфер|пусковое устройство|аккумулятор|сварочный аппарат|циркулярная пила|торцовочная пила|аквариум|террариум|теплица|газонокосилка|кольцо золотое|чемодан)/i]
const midPriceMatchers = [/(смарт-часы|фитнес-браслет|наушники|колонка|веб-камера|роутер|жесткий диск|ssd|пауэрбанк|зарядка|смарт|камера|видеорегистратор|принтер для фото|кольцевая лампа|геймпад|кулер|мышь|клавиатура|кресло офисное|стол компьютерный|usb-микрофон|гарнитура|мфу|ламинатор|переплетчик|счетчик банкнот|оперативная память|блок питания|корпус пк|кулер для процессора|хлебопечка|электрогриль|фен|электробритва|эпилятор|сковорода|кастрюля|термос|термокружка|плед|постельное белье|штора|комод|торшер|люстра|картина|пуховик|пальто|спортивный костюм|ботинки|кроссовки|сапоги|стерилизатор|стульчик для кормления|радионяня|видеоняня|ирригатор|духи|йога-коврик|гантели|гири|палатка|спальный мешок|ролики|самокат|коньки|маска горнолыжная|автомобильный компрессор|радар-детектор|парктроник|автопылесос|домкрат|дрель|шуруповерт|перфоратор|лобзик|краскопульт|набор инструментов|фильтр для аквариума|переноска для животных|энциклопедия|конструктор|кукла|радиоуправляемая машина|батут|алмазная мозаика|кофе зерновой|сыр твердый|креветки|орехи|саженец|секатор|мангал|садовая мебель|часы наручные|солнцезащитные очки|сумка|рюкзак городской)/i]
const lowPriceMatchers = [/(кнопочный телефон|кабель|адаптер|стекло|пленка|попсокет|игла|лоток|салфетка|набор для чистки|ремешок|брелок|амбушюры|диктофон|калькулятор|лазерная указка|usb-флешка|карта памяти|bluetooth-адаптер|wi-fi-усилитель|монопод|стилус|подставка для телефона|картридер|игла|коврик для мыши|термопаста|бумага|тонер|органайзер для кабелей|доска разделочная|ложка|половник|лопатка|венчик|открывалка|штопор|полотенце|салфетки тканевые|наволочка|подушка|колготки|носки|берет|шарф|перчатки|ремень|галстук|бабочка|сланцы|чешки|бахилы|соска|пеленка|царапки|пенал|горшок|прорезыватель|термометр|маска для лица|бальзам для губ|лак для ногтей|ватные диски|ватные палочки|резинка фитнес|скакалка|бутылка спортивная|шейкер|компас|мяч|щетка стеклоочистителя|ароматизатор|салфетка из микрофибры|аварийный знак|аптечка автомобильная|огнетушитель|канистра|пассатижи|бокорезы|шпатель|кисть малярная|скотч малярный|герметик|цемент|шпатлевка|грунтовка|розетка|выключатель|ошейник|поводок|адресник|совок для лотка|корм для рыб|витамины для животных|тетрадь|блокнот|ручка|карандаш|ластик|точилка|линейка|клей|ножницы|скрепки|стикеры|закладки|мыльные пузыри|пластилин|головоломка|вода питьевая|сок|чай|молоко|кефир|йогурт|яйца|хлеб|макароны|рис|гречка|мука|сахар|соль|масло|картофель|лук|морковь|яблоки|бананы|апельсины|печенье|шоколад|мед|джем|семена|грунт|торф|лейка|перчатки садовые|шампуры|подвеска|цепочка|браслет|брошь|заколка|ободок|косметичка|ключница)/i]

function parseSource(raw) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const categories = []
  let current = null
  for (const line of lines) {
    const heading = line.match(/^\d+\.\s+(.+)$/)
    if (heading) {
      current = { name: heading[1], items: [] }
      categories.push(current)
      continue
    }
    if (!current) continue
    current.items.push(...line.split(';').map((item) => item.trim()).filter(Boolean))
  }
  return categories
}

function extractLegacyValues(content, regex, label) {
  const match = content.match(regex)
  if (!match) {
    throw new Error(`Could not extract ${label} from previous migration`)
  }
  return match[1].trim()
}

function hashInt(seed) {
  return parseInt(createHash('md5').update(seed).digest('hex').slice(0, 8), 16)
}

function stableUUID(seed) {
  const bytes = Buffer.from(createHash('md5').update(seed).digest('hex'), 'hex')
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function transliterate(value) {
  return value.split('').map((char) => translitMap.get(char.toLowerCase()) ?? char.toLowerCase()).join('')
}

function slugify(value) {
  return transliterate(value).replace(/&/g, ' and ').replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
}

function titleize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function pick(items, seed) {
  return items[hashInt(seed) % items.length]
}

function scale(seed, min, max) {
  return min + (hashInt(seed) % (max - min + 1))
}

function formatPrice(value) {
  if (value < 1000) return Math.round(value / 10) * 10
  if (value < 10000) return Math.round(value / 50) * 50
  return Math.round(value / 100) * 100
}

function priceFor(meta, item, key) {
  const lower = item.toLowerCase()
  let range = meta.priceRange
  if (expensiveMatchers.some((matcher) => matcher.test(lower))) {
    range = meta.premiumRange ?? [Math.max(meta.priceRange[0], 4990), Math.max(meta.priceRange[1], 69990)]
  } else if (midPriceMatchers.some((matcher) => matcher.test(lower))) {
    range = [Math.max(meta.priceRange[0], 790), Math.max(meta.priceRange[0] + 3000, Math.floor(meta.priceRange[1] * 0.6))]
  } else if (lowPriceMatchers.some((matcher) => matcher.test(lower))) {
    range = [meta.priceRange[0], Math.min(meta.priceRange[1], Math.max(meta.priceRange[0] + 1000, Math.floor(meta.priceRange[1] * 0.2)))]
  }
  return formatPrice(scale(`price:${key}`, range[0], range[1]))
}

function stockFor(meta, item, key) {
  const lower = item.toLowerCase()
  if (expensiveMatchers.some((matcher) => matcher.test(lower))) return scale(`stock:${key}`, 2, Math.min(18, meta.stockRange[1]))
  if (lowPriceMatchers.some((matcher) => matcher.test(lower))) return scale(`stock:${key}`, Math.max(12, meta.stockRange[0]), Math.max(36, meta.stockRange[1]))
  return scale(`stock:${key}`, meta.stockRange[0], meta.stockRange[1])
}

function unitFor(item) {
  const lower = item.toLowerCase()
  if (/(набор|комплект|конструктор|набор для)/i.test(lower)) return 'set'
  if (/(носки|колготки|перчатки|варежки|кроссовки|ботинки|сандалии|тапочки|бахилы|пуанты|чешки|шиповки|кеды|туфли|сланцы|берцы|дутики|угги|валенки|галоши|ласты|очки для плавания)/i.test(lower)) return 'pair'
  if (/(масло|шампунь|крем|тоник|пенка|лосьон|гель|мыло|дезодорант|духи|вода питьевая|сок|молоко|кефир|йогурт|антифриз|омыват|жидкость|полироль|шампунь для авто)/i.test(lower)) return 'bottle'
  if (/(бумага|салфетки|подгузники|влажные салфетки|ватные диски|ватные палочки|консервы|пельмени|вареники|замороженные овощи|наполнитель|корм|лакомства)/i.test(lower)) return 'pack'
  return 'piece'
}

function specsFor(meta, categoryName, seller, item, stockQty, price) {
  const lower = item.toLowerCase()
  const specs = { category: categoryName, seller: seller.storeName, availability: `${stockQty} in stock`, delivery: meta.delivery }
  if (/(одежд|обув|купальник|пижама|тапочки|кроссовки|ботинки|пуховик|платье|джинсы|брюки|худи|свитер|футболка)/i.test(lower)) {
    specs.fit = 'daily wear'
    specs.season = 'all-season assortment'
  } else if (/(крем|шампунь|маска|масло|помада|тушь|паста|ирригатор|щетка|станок)/i.test(lower)) {
    specs.routine = 'daily care'
    specs.format = 'retail ready'
  } else if (/(вода питьевая|сок|чай|кофе|молоко|кефир|йогурт|сыр|творог|масло|яйца|хлеб|рис|гречка|овсянка|мука|сахар|соль|картофель|лук|морковь|яблоки|бананы|апельсины|печенье|шоколад|мед|джем)/i.test(lower)) {
    specs.segment = 'everyday grocery'
    specs.storage = 'fresh marketplace stock'
  } else if (/(смартфон|планшет|ноутбук|монитор|телевизор|наушники|колонка|камера|консоль|роутер|ssd|флешка|зарядка|кабель|адаптер|проектор|принтер|сканер)/i.test(lower)) {
    specs.warranty = '12 months'
    specs.segment = price >= 30000 ? 'flagship assortment' : 'best-value assortment'
  } else if (/(диван|стол|стул|шкаф|кровать|матрас|комод|тумба|торшер|люстра|картина|ваза)/i.test(lower)) {
    specs.room = 'home interior'
    specs.fulfillment = 'scheduled delivery'
  } else if (/(дрель|шуруповерт|перфоратор|лобзик|пила|краскопульт|сварочный аппарат|паяльник|отверток|молоток|уровень|пена|герметик|цемент|краска|обои|ламинат|линолеум)/i.test(lower)) {
    specs.use_case = 'repair and installation'
    specs.fulfillment = 'warehouse stock'
  } else {
    specs.segment = 'marketplace assortment'
    specs.fulfillment = 'fast delivery'
  }
  return specs
}

function imageRef(slug, variant) {
  return `marketplace-media://product/${slug}/${variant}`
}

function descriptionFor(categoryName, seller, productName) {
  return `${productName} в категории «${categoryName}» от магазина ${seller.storeName}. Актуальная цена, подтвержденный остаток и доставка через универсальный маркетплейс без лишних шагов.`
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlUUID(value) {
  return `${sqlString(value)}::uuid`
}

function sqlJSON(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function sqlCategoryRow(category) {
  return `\t\t(${sqlUUID(category.id)}, NULL::uuid, ${sqlString(category.name)}, ${sqlString(category.slug)})`
}

function sqlProductRow(product) {
  return `\t\t(\n\t\t\t${sqlUUID(product.id)},\n\t\t\t${sqlUUID(product.categoryID)},\n\t\t\t${sqlUUID(product.sellerID)},\n\t\t\t${sqlString(product.name)},\n\t\t\t${sqlString(product.slug)},\n\t\t\t${sqlString(product.description)},\n\t\t\t${product.price.toFixed(2)},\n\t\t\t${sqlString(product.currency)},\n\t\t\t${sqlString(product.sku)},\n\t\t\t${product.stockQty},\n\t\t\tTRUE,\n\t\t\t${sqlString(product.imageUrl)},\n\t\t\t${sqlJSON(product.gallery)},\n\t\t\t${sqlString(product.brand)},\n\t\t\t${sqlString(product.unit)},\n\t\t\t${sqlJSON(product.specs)}\n\t\t)`
}

const source = readFileSync(sourcePath, 'utf8')
const previousMigration = readFileSync(previousMigrationPath, 'utf8')
const legacyCategoryValues = extractLegacyValues(previousMigration, /WITH category_updates \(id, parent_id, name, slug\) AS \(\s*VALUES([\s\S]*?)\n\)\nUPDATE categories c/, 'legacy categories')
const legacyProductValues = extractLegacyValues(previousMigration, /WITH product_updates \([\s\S]*?\) AS \(\s*VALUES([\s\S]*?)\n\)\nUPDATE products p/, 'legacy products')
const parsedCategories = parseSource(source)

for (const category of parsedCategories) {
  if (!categoryMeta[category.name]) throw new Error(`Missing metadata for category: ${category.name}`)
}

const categories = parsedCategories.map((category, index) => {
  const meta = categoryMeta[category.name]
  return {
    id: index < legacyCategoryIDs.length ? legacyCategoryIDs[index] : stableUUID(`category:${meta.slug}`),
    name: category.name,
    slug: meta.slug,
    items: category.items,
    meta,
  }
})

let flatIndex = 0
const products = []
for (const category of categories) {
  const seller = sellers[category.meta.sellerKey]
  category.items.forEach((item, itemIndex) => {
    const productName = titleize(item)
    const itemSlug = slugify(item)
    const slug = `${category.slug}-${itemSlug}`
    const id = flatIndex < legacyProductIDs.length ? legacyProductIDs[flatIndex] : stableUUID(`product:${category.slug}:${itemSlug}`)
    const key = `${category.slug}:${itemSlug}`
    const price = priceFor(category.meta, item, key)
    const stockQty = stockFor(category.meta, item, key)
    const gallery = [imageRef(slug, 'hero'), imageRef(slug, 'detail'), imageRef(slug, 'lifestyle')]
    products.push({
      id,
      categoryID: category.id,
      sellerID: seller.id,
      name: productName,
      slug,
      description: descriptionFor(category.name, seller, productName),
      price,
      currency: 'RUB',
      sku: `SEED-${category.meta.code}-${String(itemIndex + 1).padStart(4, '0')}`,
      stockQty,
      imageUrl: gallery[0],
      gallery,
      brand: pick(category.meta.brands, `${key}:brand`),
      unit: unitFor(item),
      specs: specsFor(category.meta, category.name, seller, item, stockQty, price),
    })
    flatIndex += 1
  })
}

const newCategoryIDs = categories.slice(legacyCategoryIDs.length).map((category) => category.id)
const popularSearches = [
  { query: 'смартфон', count: 18 },
  { query: 'ноутбук', count: 15 },
  { query: 'кроссовки', count: 14 },
  { query: 'робот-пылесос', count: 13 },
  { query: 'кофемашина', count: 12 },
  { query: 'рюкзак', count: 11 },
]

const migration = `-- Code generated by scripts/generate_catalog_refresh.mjs. DO NOT EDIT.
-- +goose Up
-- +goose StatementBegin
WITH desired_categories (id, parent_id, name, slug) AS (
\tVALUES
${categories.map(sqlCategoryRow).join(',\n')}
)
INSERT INTO categories (id, parent_id, name, slug)
SELECT id, parent_id, name, slug
FROM desired_categories
ON CONFLICT (id) DO UPDATE
SET
\tparent_id = EXCLUDED.parent_id,
\tname = EXCLUDED.name,
\tslug = EXCLUDED.slug;

WITH desired_products (
\tid, category_id, seller_id, name, slug, description, price, currency, sku, stock_qty, is_active, image_url, gallery, brand, unit, specs
) AS (
\tVALUES
${products.map(sqlProductRow).join(',\n')}
)
INSERT INTO products (id, category_id, seller_id, name, slug, description, price, currency, sku, stock_qty, is_active, image_url, gallery, brand, unit, specs)
SELECT id, category_id, seller_id, name, slug, description, price, currency, sku, stock_qty, is_active, image_url, gallery, brand, unit, specs
FROM desired_products
ON CONFLICT (id) DO UPDATE
SET
\tcategory_id = EXCLUDED.category_id,
\tseller_id = EXCLUDED.seller_id,
\tname = EXCLUDED.name,
\tslug = EXCLUDED.slug,
\tdescription = EXCLUDED.description,
\tprice = EXCLUDED.price,
\tcurrency = EXCLUDED.currency,
\tsku = EXCLUDED.sku,
\tstock_qty = EXCLUDED.stock_qty,
\tis_active = EXCLUDED.is_active,
\timage_url = EXCLUDED.image_url,
\tgallery = EXCLUDED.gallery,
\tbrand = EXCLUDED.brand,
\tunit = EXCLUDED.unit,
\tspecs = EXCLUDED.specs;

DELETE FROM search_queries
WHERE LOWER(query_text) IN ('cement', 'oak', 'birch', 'aspen', 'nails', 'цемент', 'дуб', 'береза', 'берёза', 'осина', 'гвозди', 'стройматериалы', 'пиломатериалы');

INSERT INTO search_queries (query_text, search_count, last_searched_at)
VALUES
${popularSearches.map((item) => `\t(${sqlString(item.query)}, ${item.count}, NOW())`).join(',\n')}
ON CONFLICT (query_text) DO UPDATE
SET
\tsearch_count = GREATEST(search_queries.search_count, EXCLUDED.search_count),
\tlast_searched_at = EXCLUDED.last_searched_at;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM products
WHERE sku LIKE 'SEED-%';

WITH legacy_categories (id, parent_id, name, slug) AS (
\tVALUES
${legacyCategoryValues}
)
INSERT INTO categories (id, parent_id, name, slug)
SELECT id, parent_id, name, slug
FROM legacy_categories
ON CONFLICT (id) DO UPDATE
SET
\tparent_id = EXCLUDED.parent_id,
\tname = EXCLUDED.name,
\tslug = EXCLUDED.slug;

DELETE FROM categories
WHERE id IN (${newCategoryIDs.map(sqlUUID).join(', ')})
\tAND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = categories.id);

WITH legacy_products (
\tid, category_id, name, slug, description, price, currency, sku, stock_qty, is_active, image_url, gallery, brand, unit, specs, seller_id
) AS (
\tVALUES
${legacyProductValues}
)
INSERT INTO products (id, category_id, name, slug, description, price, currency, sku, stock_qty, is_active, image_url, gallery, brand, unit, specs, seller_id)
SELECT id, category_id, name, slug, description, price, currency, sku, stock_qty, is_active, image_url, gallery, brand, unit, specs, seller_id
FROM legacy_products
ON CONFLICT (id) DO UPDATE
SET
\tcategory_id = EXCLUDED.category_id,
\tname = EXCLUDED.name,
\tslug = EXCLUDED.slug,
\tdescription = EXCLUDED.description,
\tprice = EXCLUDED.price,
\tcurrency = EXCLUDED.currency,
\tsku = EXCLUDED.sku,
\tstock_qty = EXCLUDED.stock_qty,
\tis_active = EXCLUDED.is_active,
\timage_url = EXCLUDED.image_url,
\tgallery = EXCLUDED.gallery,
\tbrand = EXCLUDED.brand,
\tunit = EXCLUDED.unit,
\tspecs = EXCLUDED.specs,
\tseller_id = EXCLUDED.seller_id;

DELETE FROM search_queries
WHERE LOWER(query_text) IN ('смартфон', 'ноутбук', 'кроссовки', 'робот-пылесос', 'кофемашина', 'рюкзак');
-- +goose StatementEnd
`

writeFileSync(outputPath, migration, 'utf8')
console.log(`Generated ${products.length} products across ${categories.length} categories -> ${outputPath}`)
