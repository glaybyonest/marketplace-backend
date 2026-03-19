-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
	DROP CONSTRAINT IF EXISTS users_role_allowed;

ALTER TABLE users
	ADD CONSTRAINT users_role_allowed CHECK (role IN ('customer', 'seller', 'admin'));

CREATE TABLE IF NOT EXISTS seller_profiles (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	store_name TEXT NOT NULL,
	store_slug TEXT NOT NULL UNIQUE,
	legal_name TEXT NULL,
	description TEXT NULL,
	logo_url TEXT NULL,
	banner_url TEXT NULL,
	support_email TEXT NULL,
	support_phone TEXT NULL,
	city TEXT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT seller_profiles_store_name_not_empty CHECK (BTRIM(store_name) <> ''),
	CONSTRAINT seller_profiles_store_slug_not_empty CHECK (BTRIM(store_slug) <> ''),
	CONSTRAINT seller_profiles_status_allowed CHECK (status IN ('pending', 'active', 'paused'))
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_status
	ON seller_profiles (status);

CREATE TRIGGER trg_seller_profiles_updated_at
	BEFORE UPDATE ON seller_profiles
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();

ALTER TABLE products
	ADD COLUMN IF NOT EXISTS seller_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_seller_id
	ON products (seller_id);

ALTER TABLE order_items
	ADD COLUMN IF NOT EXISTS seller_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS seller_store_name TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_seller_id
	ON order_items (seller_id);

INSERT INTO users (
	id,
	email,
	password_hash,
	full_name,
	role,
	email_verified_at
)
VALUES
	(
		'33333333-3333-3333-3333-333333333301',
		'merchant-urbanwave@seed.marketplace.local',
		'$2a$10$5c005ew/Ph3.vc3qqANJ.uXIdIEP13UaZIUyQR1ztneu0xmt9S4fi',
		'Alex Mercer',
		'seller',
		NOW()
	),
	(
		'33333333-3333-3333-3333-333333333302',
		'merchant-casaluna@seed.marketplace.local',
		'$2a$10$5c005ew/Ph3.vc3qqANJ.uXIdIEP13UaZIUyQR1ztneu0xmt9S4fi',
		'Maria Volkova',
		'seller',
		NOW()
	),
	(
		'33333333-3333-3333-3333-333333333303',
		'merchant-roamfit@seed.marketplace.local',
		'$2a$10$5c005ew/Ph3.vc3qqANJ.uXIdIEP13UaZIUyQR1ztneu0xmt9S4fi',
		'Ilya Sokolov',
		'seller',
		NOW()
	)
ON CONFLICT (id) DO NOTHING;

INSERT INTO seller_profiles (
	user_id,
	store_name,
	store_slug,
	legal_name,
	description,
	logo_url,
	banner_url,
	support_email,
	support_phone,
	city,
	status
)
VALUES
	(
		'33333333-3333-3333-3333-333333333301',
		'UrbanWave',
		'urbanwave',
		'UrbanWave Retail LLC',
		'Personal audio, travel gadgets and everyday electronics with fast fulfillment from Moscow.',
		'https://placehold.co/240x240/10327a/f5f8ff?text=UW',
		'https://placehold.co/1440x480/102b62/e6f1ff?text=UrbanWave+Storefront',
		'care@urbanwave.market',
		'+74951234567',
		'Moscow',
		'active'
	),
	(
		'33333333-3333-3333-3333-333333333302',
		'Casa Luna',
		'casa-luna',
		'Casa Luna Home Goods',
		'Curated home essentials, kitchen upgrades and storage systems for modern apartments and studios.',
		'https://placehold.co/240x240/7a4210/fff5eb?text=CL',
		'https://placehold.co/1440x480/6a3710/fff0dd?text=Casa+Luna+Home',
		'hello@casaluna.market',
		'+74957654321',
		'Saint Petersburg',
		'active'
	),
	(
		'33333333-3333-3333-3333-333333333303',
		'Roam & Fit',
		'roam-fit',
		'Roam and Fit Commerce',
		'Bags, travel accessories and wellness gear built for active routines and weekend trips.',
		'https://placehold.co/240x240/0f5b4f/ecfff9?text=RF',
		'https://placehold.co/1440x480/0d4b42/e4fff7?text=Roam+%26+Fit',
		'support@roamfit.market',
		'+74959876543',
		'Kazan',
		'active'
	)
ON CONFLICT (user_id) DO UPDATE
SET
	store_name = EXCLUDED.store_name,
	store_slug = EXCLUDED.store_slug,
	legal_name = EXCLUDED.legal_name,
	description = EXCLUDED.description,
	logo_url = EXCLUDED.logo_url,
	banner_url = EXCLUDED.banner_url,
	support_email = EXCLUDED.support_email,
	support_phone = EXCLUDED.support_phone,
	city = EXCLUDED.city,
	status = EXCLUDED.status;

WITH category_updates (id, parent_id, name, slug) AS (
	VALUES
		('11111111-1111-1111-1111-111111111111'::uuid, NULL::uuid, 'Electronics', 'electronics'),
		('11111111-1111-1111-1111-111111111112'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Audio & Gadgets', 'audio-gadgets'),
		('11111111-1111-1111-1111-111111111113'::uuid, NULL::uuid, 'Home & Living', 'home-living'),
		('11111111-1111-1111-1111-111111111114'::uuid, '11111111-1111-1111-1111-111111111113'::uuid, 'Kitchen & Dining', 'kitchen-dining'),
		('11111111-1111-1111-1111-111111111115'::uuid, '11111111-1111-1111-1111-111111111113'::uuid, 'Storage & Organization', 'storage-organization'),
		('11111111-1111-1111-1111-111111111116'::uuid, NULL::uuid, 'Style & Accessories', 'style-accessories'),
		('11111111-1111-1111-1111-111111111117'::uuid, '11111111-1111-1111-1111-111111111116'::uuid, 'Bags & Travel', 'bags-travel'),
		('11111111-1111-1111-1111-111111111118'::uuid, NULL::uuid, 'Sport & Wellness', 'sport-wellness')
)
UPDATE categories c
SET
	parent_id = category_updates.parent_id,
	name = category_updates.name,
	slug = category_updates.slug
FROM category_updates
WHERE c.id = category_updates.id;

WITH product_updates (
	id,
	category_id,
	name,
	slug,
	description,
	price,
	currency,
	sku,
	stock_qty,
	is_active,
	image_url,
	gallery,
	brand,
	unit,
	specs,
	seller_id
) AS (
	VALUES
		(
			'22222222-2222-2222-2222-222222222201'::uuid,
			'11111111-1111-1111-1111-111111111112'::uuid,
			'Wireless Headphones Aurora',
			'wireless-headphones-aurora',
			'Over-ear headphones with adaptive noise reduction, all-day battery life and compact travel case.',
			8990.00,
			'RUB',
			'UW-AURORA-01',
			34,
			TRUE,
			'https://placehold.co/1200x900/e7f0ff/173f8f?text=Aurora+Headphones',
			'["https://placehold.co/1200x900/f1f6ff/264f9d?text=Noise+Control","https://placehold.co/1200x900/e8f5f2/1f6a63?text=Travel+Case"]'::jsonb,
			'UrbanWave',
			'piece',
			'{"battery_life":"40 h","wireless":"Bluetooth 5.3","microphones":"4","weight":"265 g"}'::jsonb,
			'33333333-3333-3333-3333-333333333301'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222202'::uuid,
			'11111111-1111-1111-1111-111111111112'::uuid,
			'Portable Speaker Pulse Mini',
			'portable-speaker-pulse-mini',
			'Compact speaker with rich bass, IPX7 splash protection and fast USB-C charging for trips and picnics.',
			4690.00,
			'RUB',
			'UW-PULSE-02',
			58,
			TRUE,
			'https://placehold.co/1200x900/e6f2ff/184789?text=Pulse+Mini+Speaker',
			'["https://placehold.co/1200x900/f2f7ff/2d5ca2?text=Portable+Audio","https://placehold.co/1200x900/e9fff8/1f705f?text=IPX7+Ready"]'::jsonb,
			'UrbanWave',
			'piece',
			'{"play_time":"18 h","protection":"IPX7","pairing":"Stereo pair","weight":"540 g"}'::jsonb,
			'33333333-3333-3333-3333-333333333301'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222203'::uuid,
			'11111111-1111-1111-1111-111111111111'::uuid,
			'Smart LED Desk Lamp Focus',
			'smart-led-desk-lamp-focus',
			'Dimmable desk lamp with wireless charging pad, timer scenes and warm-to-cool light presets.',
			5390.00,
			'RUB',
			'UW-FOCUS-03',
			42,
			TRUE,
			'https://placehold.co/1200x900/f4f7ff/27406d?text=Focus+Desk+Lamp',
			'["https://placehold.co/1200x900/f9fbff/3d5d90?text=Wireless+Charge","https://placehold.co/1200x900/fff6e7/8a5c21?text=Light+Scenes"]'::jsonb,
			'Voltio',
			'piece',
			'{"power":"12 W","charging":"Qi pad","modes":"5 scenes","material":"aluminum"}'::jsonb,
			'33333333-3333-3333-3333-333333333301'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222204'::uuid,
			'11111111-1111-1111-1111-111111111114'::uuid,
			'Stand Mixer Nova 5L',
			'stand-mixer-nova-5l',
			'Kitchen mixer with stainless bowl, planetary rotation and three attachments for dough, cream and batter.',
			15990.00,
			'RUB',
			'CL-NOVA-04',
			16,
			TRUE,
			'https://placehold.co/1200x900/fff3eb/8c4f1a?text=Nova+Stand+Mixer',
			'["https://placehold.co/1200x900/fff8f2/a8662b?text=5L+Bowl","https://placehold.co/1200x900/fcf0e5/87511f?text=3+Attachments"]'::jsonb,
			'Casa Luna',
			'piece',
			'{"capacity":"5 l","speeds":"8","attachments":"3","finish":"matte"}'::jsonb,
			'33333333-3333-3333-3333-333333333302'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222205'::uuid,
			'11111111-1111-1111-1111-111111111114'::uuid,
			'Burr Coffee Grinder Origin',
			'burr-coffee-grinder-origin',
			'Coffee grinder with 24 settings, quiet motor and removable hopper for espresso and filter brewing.',
			7490.00,
			'RUB',
			'CL-ORIGIN-05',
			23,
			TRUE,
			'https://placehold.co/1200x900/fff1e7/8f5320?text=Origin+Grinder',
			'["https://placehold.co/1200x900/fff7f0/a26831?text=24+Settings","https://placehold.co/1200x900/f6ede4/7d4e22?text=Quiet+Motor"]'::jsonb,
			'Casa Luna',
			'piece',
			'{"settings":"24","hopper":"250 g","use":"espresso and filter","material":"steel burrs"}'::jsonb,
			'33333333-3333-3333-3333-333333333302'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222206'::uuid,
			'11111111-1111-1111-1111-111111111115'::uuid,
			'Glass Meal Prep Containers 6pc',
			'glass-meal-prep-containers-6pc',
			'Set of stackable borosilicate containers with leakproof lids for freezer, oven and weekday meal planning.',
			3290.00,
			'RUB',
			'CL-PREP-06',
			64,
			TRUE,
			'https://placehold.co/1200x900/f8f3ee/7f5738?text=Meal+Prep+Set',
			'["https://placehold.co/1200x900/fcf8f3/8d6643?text=Leakproof+Lids","https://placehold.co/1200x900/f0ece6/6e4b31?text=Stackable+Storage"]'::jsonb,
			'Casa Luna',
			'set',
			'{"pieces":"6","material":"borosilicate glass","safe_for":"oven, freezer, dishwasher","capacity":"640 ml each"}'::jsonb,
			'33333333-3333-3333-3333-333333333302'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222207'::uuid,
			'11111111-1111-1111-1111-111111111115'::uuid,
			'Modular Drawer Organizers Set',
			'modular-drawer-organizers-set',
			'Expandable tray system for cosmetics, desk supplies and accessories with mix-and-match module sizes.',
			2190.00,
			'RUB',
			'CL-MOD-07',
			71,
			TRUE,
			'https://placehold.co/1200x900/f7f1ec/7a5234?text=Drawer+Organizers',
			'["https://placehold.co/1200x900/fdf8f3/8a6240?text=Expandable+Fit","https://placehold.co/1200x900/eff4ee/4e6d45?text=Multi-room+Use"]'::jsonb,
			'Casa Luna',
			'set',
			'{"modules":"8","material":"recycled plastic","finish":"soft matte","use":"drawer organization"}'::jsonb,
			'33333333-3333-3333-3333-333333333302'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222208'::uuid,
			'11111111-1111-1111-1111-111111111117'::uuid,
			'Everyday Crossbody Bag Metro',
			'everyday-crossbody-bag-metro',
			'Compact crossbody with smart inner pockets, adjustable strap and water-resistant shell for daily carry.',
			3990.00,
			'RUB',
			'RF-METRO-08',
			39,
			TRUE,
			'https://placehold.co/1200x900/ecfff8/0f5f4f?text=Metro+Crossbody',
			'["https://placehold.co/1200x900/f3fffb/1d6f5f?text=Daily+Carry","https://placehold.co/1200x900/f6f2ea/86613a?text=Water-resistant"]'::jsonb,
			'Roam & Fit',
			'piece',
			'{"volume":"4 l","material":"water-resistant nylon","strap":"adjustable","pockets":"5"}'::jsonb,
			'33333333-3333-3333-3333-333333333303'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222209'::uuid,
			'11111111-1111-1111-1111-111111111117'::uuid,
			'Carry-on Travel Duffel Atlas',
			'carry-on-travel-duffel-atlas',
			'Soft duffel with shoe compartment, luggage sleeve and cabin-friendly proportions for short trips.',
			6790.00,
			'RUB',
			'RF-ATLAS-09',
			27,
			TRUE,
			'https://placehold.co/1200x900/effff8/106353?text=Atlas+Duffel',
			'["https://placehold.co/1200x900/f4fffb/23715e?text=Carry-on+Ready","https://placehold.co/1200x900/eef6ff/2d4e85?text=Shoe+Compartment"]'::jsonb,
			'Roam & Fit',
			'piece',
			'{"volume":"32 l","compartments":"4","carry_on":"yes","material":"ripstop polyester"}'::jsonb,
			'33333333-3333-3333-3333-333333333303'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222210'::uuid,
			'11111111-1111-1111-1111-111111111118'::uuid,
			'Pro Yoga Mat 6mm',
			'pro-yoga-mat-6mm',
			'Non-slip mat with balanced cushioning, alignment marks and carry strap for home and studio sessions.',
			2890.00,
			'RUB',
			'RF-YOGA-10',
			84,
			TRUE,
			'https://placehold.co/1200x900/eafff9/0d6c58?text=Pro+Yoga+Mat',
			'["https://placehold.co/1200x900/f3fffb/1d7a66?text=6mm+Cushion","https://placehold.co/1200x900/f4f8ff/3f5e97?text=Alignment+Marks"]'::jsonb,
			'Roam & Fit',
			'piece',
			'{"thickness":"6 mm","length":"183 cm","surface":"non-slip","extras":"carry strap"}'::jsonb,
			'33333333-3333-3333-3333-333333333303'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222211'::uuid,
			'11111111-1111-1111-1111-111111111118'::uuid,
			'Resistance Bands Kit',
			'resistance-bands-kit',
			'Five-band training kit with door anchor, handles and compact pouch for strength sessions anywhere.',
			2490.00,
			'RUB',
			'RF-BANDS-11',
			96,
			TRUE,
			'https://placehold.co/1200x900/e9fff7/0f644f?text=Resistance+Bands',
			'["https://placehold.co/1200x900/f3fffa/1f725d?text=5+Bands","https://placehold.co/1200x900/fff5ec/93662f?text=Handles+%26+Anchor"]'::jsonb,
			'Roam & Fit',
			'kit',
			'{"bands":"5","resistance":"5-45 kg","accessories":"handles, anchor, pouch","use":"full-body training"}'::jsonb,
			'33333333-3333-3333-3333-333333333303'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222212'::uuid,
			'11111111-1111-1111-1111-111111111113'::uuid,
			'Ceramic Aroma Candle Set',
			'ceramic-aroma-candle-set',
			'Gift-ready trio of ceramic candles with layered scents, slow burn wax and reusable jars.',
			2590.00,
			'RUB',
			'CL-CANDLE-12',
			49,
			TRUE,
			'https://placehold.co/1200x900/fff4ef/97552a?text=Aroma+Candle+Set',
			'["https://placehold.co/1200x900/fff9f5/a86738?text=Gift+Ready","https://placehold.co/1200x900/f6efe7/866040?text=Reusable+Ceramic"]'::jsonb,
			'Casa Luna',
			'set',
			'{"candles":"3","burn_time":"24 h each","scents":"amber, fig, cotton","jar":"ceramic"}'::jsonb,
			'33333333-3333-3333-3333-333333333302'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222213'::uuid,
			'11111111-1111-1111-1111-111111111115'::uuid,
			'Desktop Cable Organizer Dock',
			'desktop-cable-organizer-dock',
			'Weighted desk dock that keeps charging cables, earbuds and adapters aligned within arm reach.',
			1490.00,
			'RUB',
			'CL-DOCK-13',
			118,
			TRUE,
			'https://placehold.co/1200x900/f2f4f7/505a68?text=Cable+Organizer+Dock',
			'["https://placehold.co/1200x900/f8fafc/667180?text=Weighted+Base","https://placehold.co/1200x900/edf4ef/567254?text=Desk+Ready"]'::jsonb,
			'Casa Luna',
			'piece',
			'{"slots":"5","base":"weighted silicone","use":"desk cable management","color":"graphite"}'::jsonb,
			'33333333-3333-3333-3333-333333333302'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222214'::uuid,
			'11111111-1111-1111-1111-111111111111'::uuid,
			'Bluetooth Tracker 4-Pack',
			'bluetooth-tracker-4-pack',
			'Four compact trackers for keys, bags and luggage with replaceable battery and loud out-of-range alert.',
			5290.00,
			'RUB',
			'UW-TRACK-14',
			51,
			TRUE,
			'https://placehold.co/1200x900/eaf2ff/224c8e?text=Tracker+4-Pack',
			'["https://placehold.co/1200x900/f4f8ff/3564a8?text=Keys+%26+Bags","https://placehold.co/1200x900/f2fff8/1e6b5c?text=Replaceable+Battery"]'::jsonb,
			'UrbanWave',
			'set',
			'{"pieces":"4","battery":"replaceable","connectivity":"Bluetooth","alerts":"sound + map"}'::jsonb,
			'33333333-3333-3333-3333-333333333301'::uuid
		),
		(
			'22222222-2222-2222-2222-222222222215'::uuid,
			'11111111-1111-1111-1111-111111111118'::uuid,
			'Insulated Travel Bottle 900ml',
			'insulated-travel-bottle-900ml',
			'Double-wall bottle that keeps drinks cold or hot for hours and fits in gym bags and car cup holders.',
			1990.00,
			'RUB',
			'RF-BOTTLE-15',
			76,
			TRUE,
			'https://placehold.co/1200x900/effff8/126a56?text=Travel+Bottle+900ml',
			'["https://placehold.co/1200x900/f5fffb/257764?text=Double-wall+Steel","https://placehold.co/1200x900/edf5ff/4464a0?text=Leakproof+Lid"]'::jsonb,
			'Roam & Fit',
			'piece',
			'{"capacity":"900 ml","insulation":"double-wall steel","lid":"leakproof","care":"dishwasher safe"}'::jsonb,
			'33333333-3333-3333-3333-333333333303'::uuid
		)
)
UPDATE products p
SET
	category_id = product_updates.category_id,
	name = product_updates.name,
	slug = product_updates.slug,
	description = product_updates.description,
	price = product_updates.price,
	currency = product_updates.currency,
	sku = product_updates.sku,
	stock_qty = product_updates.stock_qty,
	is_active = product_updates.is_active,
	image_url = product_updates.image_url,
	gallery = product_updates.gallery,
	brand = product_updates.brand,
	unit = product_updates.unit,
	specs = product_updates.specs,
	seller_id = product_updates.seller_id
FROM product_updates
WHERE p.id = product_updates.id;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
WITH category_updates (id, parent_id, name, slug) AS (
	VALUES
		('11111111-1111-1111-1111-111111111111'::uuid, NULL::uuid, 'Стройматериалы', 'stroymaterialy'),
		('11111111-1111-1111-1111-111111111112'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Цемент', 'cement'),
		('11111111-1111-1111-1111-111111111113'::uuid, NULL::uuid, 'Пиломатериалы', 'pilomaterialy'),
		('11111111-1111-1111-1111-111111111114'::uuid, '11111111-1111-1111-1111-111111111113'::uuid, 'Дуб', 'oak'),
		('11111111-1111-1111-1111-111111111115'::uuid, '11111111-1111-1111-1111-111111111113'::uuid, 'Осина', 'aspen'),
		('11111111-1111-1111-1111-111111111116'::uuid, '11111111-1111-1111-1111-111111111113'::uuid, 'Берёза', 'birch'),
		('11111111-1111-1111-1111-111111111117'::uuid, NULL::uuid, 'Крепёж', 'krepezh'),
		('11111111-1111-1111-1111-111111111118'::uuid, '11111111-1111-1111-1111-111111111117'::uuid, 'Гвозди', 'nails')
)
UPDATE categories c
SET
	parent_id = category_updates.parent_id,
	name = category_updates.name,
	slug = category_updates.slug
FROM category_updates
WHERE c.id = category_updates.id;

WITH product_updates (
	id,
	category_id,
	name,
	slug,
	description,
	price,
	currency,
	sku,
	stock_qty,
	is_active,
	image_url,
	gallery,
	brand,
	unit,
	specs
) AS (
	VALUES
		(
			'22222222-2222-2222-2222-222222222201'::uuid,
			'11111111-1111-1111-1111-111111111112'::uuid,
			'Цемент М500 25кг',
			'cement-m500-25kg',
			'Портландцемент для общестроительных работ',
			420.00,
			'RUB',
			'CEM-M500-25',
			240,
			TRUE,
			'https://placehold.co/1200x900/e7f0ff/1d4f91?text=Cement+M500+25kg',
			'["https://placehold.co/1200x900/f5f8ff/315d9b?text=Portland+Cement","https://placehold.co/1200x900/edf6ea/2f6b2f?text=25kg+Bag"]'::jsonb,
			'EuroMix',
			'bag',
			'{"weight":"25 kg","grade":"M500","application":"foundation and screed","composition":"Portland cement"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222202'::uuid,
			'11111111-1111-1111-1111-111111111112'::uuid,
			'Цемент М400 50кг',
			'cement-m400-50kg',
			'Универсальный цемент для бетонирования',
			630.00,
			'RUB',
			'CEM-M400-50',
			150,
			TRUE,
			'https://placehold.co/1200x900/e8efff/254f8e?text=Cement+M400+50kg',
			'["https://placehold.co/1200x900/f6f8ff/3b66a8?text=Universal+Mix","https://placehold.co/1200x900/f1ece4/7d5c2e?text=50kg+Bag"]'::jsonb,
			'BuildStone',
			'bag',
			'{"weight":"50 kg","grade":"M400","application":"concrete and masonry","setting_time":"standard"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222203'::uuid,
			'11111111-1111-1111-1111-111111111112'::uuid,
			'Сухая смесь цементная 40кг',
			'cement-mix-40kg',
			'Смесь для штукатурных и кладочных работ',
			540.00,
			'RUB',
			'CEM-MIX-40',
			180,
			TRUE,
			'https://placehold.co/1200x900/eaf2ff/295291?text=Cement+Mix+40kg',
			'["https://placehold.co/1200x900/f5f8ff/426ca7?text=Dry+Mix","https://placehold.co/1200x900/efe9df/73552a?text=Ready+for+Plaster"]'::jsonb,
			'MasterBlend',
			'bag',
			'{"weight":"40 kg","type":"dry cement mix","application":"plaster and masonry","indoor_outdoor":"both"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222204'::uuid,
			'11111111-1111-1111-1111-111111111114'::uuid,
			'Доска дуб 50x150x3000',
			'oak-board-50-150-3000',
			'Строганая доска из дуба',
			1890.00,
			'RUB',
			'OAK-BRD-50-150-3M',
			90,
			TRUE,
			'https://placehold.co/1200x900/f2e6d8/6f4a1f?text=Oak+Board+50x150x3000',
			'["https://placehold.co/1200x900/f7efe6/8a5b27?text=Solid+Oak","https://placehold.co/1200x900/e8dcc9/5f3f1c?text=Planed+Surface"]'::jsonb,
			'NordWood',
			'board',
			'{"dimensions":"50x150x3000 mm","species":"oak","finish":"planed","use":"structural and finish carpentry"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222205'::uuid,
			'11111111-1111-1111-1111-111111111114'::uuid,
			'Брус дуб 100x100x3000',
			'oak-beam-100-100-3000',
			'Прочный дубовый брус',
			2650.00,
			'RUB',
			'OAK-BEAM-100-100-3M',
			70,
			TRUE,
			'https://placehold.co/1200x900/f0e3d4/744a20?text=Oak+Beam+100x100x3000',
			'["https://placehold.co/1200x900/f8efe4/8d5d2b?text=Oak+Beam","https://placehold.co/1200x900/e4d6c3/5b3a18?text=Load+Bearing"]'::jsonb,
			'NordWood',
			'piece',
			'{"dimensions":"100x100x3000 mm","species":"oak","strength":"high","use":"framing and supports"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222206'::uuid,
			'11111111-1111-1111-1111-111111111115'::uuid,
			'Доска осина 25x100x3000',
			'aspen-board-25-100-3000',
			'Лёгкая доска для внутренних работ',
			890.00,
			'RUB',
			'ASP-BRD-25-100-3M',
			140,
			TRUE,
			'https://placehold.co/1200x900/f4efe7/7b5d34?text=Aspen+Board+25x100x3000',
			'["https://placehold.co/1200x900/f9f4ed/8e7041?text=Light+Aspen","https://placehold.co/1200x900/ede4d8/6a4f2c?text=Interior+Use"]'::jsonb,
			'Siberia Timber',
			'board',
			'{"dimensions":"25x100x3000 mm","species":"aspen","weight":"light","use":"interior trim"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222207'::uuid,
			'11111111-1111-1111-1111-111111111115'::uuid,
			'Вагонка осина 14x96x2000',
			'aspen-panel-14-96-2000',
			'Вагонка для бань и саун',
			760.00,
			'RUB',
			'ASP-PNL-14-96-2M',
			200,
			TRUE,
			'https://placehold.co/1200x900/f2ecdf/7d6236?text=Aspen+Panel+14x96x2000',
			'["https://placehold.co/1200x900/f8f2e7/977647?text=Sauna+Panel","https://placehold.co/1200x900/ede3d1/6b542f?text=Smooth+Tongue+and+Groove"]'::jsonb,
			'Siberia Timber',
			'panel',
			'{"dimensions":"14x96x2000 mm","species":"aspen","profile":"tongue and groove","use":"bath and sauna finishing"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222208'::uuid,
			'11111111-1111-1111-1111-111111111116'::uuid,
			'Фанера берёза ФК 12мм',
			'birch-plywood-fk-12',
			'Листовая фанера берёзовая',
			1290.00,
			'RUB',
			'BIR-PLY-FK-12',
			120,
			TRUE,
			'https://placehold.co/1200x900/f2eadc/80663b?text=Birch+Plywood+12mm',
			'["https://placehold.co/1200x900/f7f1e7/96784a?text=FK+Plywood","https://placehold.co/1200x900/ece2d2/6e5530?text=Birch+Sheet"]'::jsonb,
			'Baltic Board',
			'sheet',
			'{"thickness":"12 mm","material":"birch plywood","grade":"FK","use":"furniture and interior work"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222209'::uuid,
			'11111111-1111-1111-1111-111111111116'::uuid,
			'Доска берёза 40x120x3000',
			'birch-board-40-120-3000',
			'Обрезная доска из берёзы',
			1180.00,
			'RUB',
			'BIR-BRD-40-120-3M',
			110,
			TRUE,
			'https://placehold.co/1200x900/f3eadd/7d6135?text=Birch+Board+40x120x3000',
			'["https://placehold.co/1200x900/f7f0e5/957445?text=Birch+Board","https://placehold.co/1200x900/ede2d1/6c542f?text=Trimmed+Edge"]'::jsonb,
			'Baltic Board',
			'board',
			'{"dimensions":"40x120x3000 mm","species":"birch","edge":"trimmed","use":"general carpentry"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222210'::uuid,
			'11111111-1111-1111-1111-111111111118'::uuid,
			'Гвозди строительные 100мм 5кг',
			'nails-100mm-5kg',
			'Стандартные строительные гвозди',
			640.00,
			'RUB',
			'NLS-100-5KG',
			260,
			TRUE,
			'https://placehold.co/1200x900/e4e8ee/3d4858?text=Construction+Nails+100mm',
			'["https://placehold.co/1200x900/f0f3f7/596577?text=Steel+Nails","https://placehold.co/1200x900/e7ebf2/4b5668?text=5kg+Pack"]'::jsonb,
			'SteelFix',
			'pack',
			'{"length":"100 mm","weight":"5 kg","material":"steel","use":"general structural fastening"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222211'::uuid,
			'11111111-1111-1111-1111-111111111118'::uuid,
			'Гвозди финишные 40мм 1кг',
			'nails-finish-40mm-1kg',
			'Финишные гвозди для отделки',
			310.00,
			'RUB',
			'NLS-FIN-40-1KG',
			300,
			TRUE,
			'https://placehold.co/1200x900/e6eaef/455061?text=Finish+Nails+40mm',
			'["https://placehold.co/1200x900/f1f4f8/5e6a7a?text=Finish+Head","https://placehold.co/1200x900/e9edf3/4e5a69?text=1kg+Pack"]'::jsonb,
			'SteelFix',
			'pack',
			'{"length":"40 mm","weight":"1 kg","head":"finish","use":"interior finishing"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222212'::uuid,
			'11111111-1111-1111-1111-111111111118'::uuid,
			'Гвозди оцинкованные 70мм 2кг',
			'nails-zinc-70mm-2kg',
			'Оцинкованные гвозди для наружных работ',
			470.00,
			'RUB',
			'NLS-ZINC-70-2KG',
			220,
			TRUE,
			'https://placehold.co/1200x900/e7ebf1/495468?text=Zinc+Nails+70mm',
			'["https://placehold.co/1200x900/f0f4f8/607081?text=Galvanized","https://placehold.co/1200x900/e5e9ef/4a5768?text=Outdoor+Use"]'::jsonb,
			'SteelFix',
			'pack',
			'{"length":"70 mm","weight":"2 kg","coating":"zinc","use":"exterior fastening"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222213'::uuid,
			'11111111-1111-1111-1111-111111111112'::uuid,
			'Цемент М600 25кг',
			'cement-m600-25kg',
			'Высокопрочный цемент для ответственных конструкций',
			760.00,
			'RUB',
			'CEM-M600-25',
			80,
			TRUE,
			'https://placehold.co/1200x900/e3efff/1f4f97?text=Cement+M600+25kg',
			'["https://placehold.co/1200x900/f2f7ff/3e6aa7?text=High+Strength","https://placehold.co/1200x900/edf4e8/336a34?text=25kg+Bag"]'::jsonb,
			'EuroMix',
			'bag',
			'{"weight":"25 kg","grade":"M600","application":"high-load concrete","strength":"high"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222214'::uuid,
			'11111111-1111-1111-1111-111111111114'::uuid,
			'Планкен дуб 20x140x3000',
			'oak-planken-20-140-3000',
			'Фасадный планкен из дуба',
			2150.00,
			'RUB',
			'OAK-PLN-20-140-3M',
			60,
			TRUE,
			'https://placehold.co/1200x900/f1e4d5/764d22?text=Oak+Planken+20x140x3000',
			'["https://placehold.co/1200x900/f8efe5/8f5f2d?text=Facade+Planken","https://placehold.co/1200x900/e7dbc8/62401d?text=Oak+Texture"]'::jsonb,
			'NordWood',
			'board',
			'{"dimensions":"20x140x3000 mm","species":"oak","profile":"planken","use":"facade and decorative cladding"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222215'::uuid,
			'11111111-1111-1111-1111-111111111116'::uuid,
			'Шпон берёза 0.6мм',
			'birch-veneer-06',
			'Декоративный берёзовый шпон',
			390.00,
			'RUB',
			'BIR-VNR-06',
			350,
			TRUE,
			'https://placehold.co/1200x900/f2eadf/84663a?text=Birch+Veneer+0.6mm',
			'["https://placehold.co/1200x900/f8f1e7/98784a?text=Decorative+Veneer","https://placehold.co/1200x900/ece1cf/70552e?text=Flexible+Sheet"]'::jsonb,
			'Baltic Board',
			'sheet',
			'{"thickness":"0.6 mm","material":"birch veneer","use":"furniture finishing","surface":"decorative"}'::jsonb
		)
)
UPDATE products p
SET
	category_id = product_updates.category_id,
	name = product_updates.name,
	slug = product_updates.slug,
	description = product_updates.description,
	price = product_updates.price,
	currency = product_updates.currency,
	sku = product_updates.sku,
	stock_qty = product_updates.stock_qty,
	is_active = product_updates.is_active,
	image_url = product_updates.image_url,
	gallery = product_updates.gallery,
	brand = product_updates.brand,
	unit = product_updates.unit,
	specs = product_updates.specs,
	seller_id = NULL
FROM product_updates
WHERE p.id = product_updates.id;

DELETE FROM users
WHERE id IN (
	'33333333-3333-3333-3333-333333333301',
	'33333333-3333-3333-3333-333333333302',
	'33333333-3333-3333-3333-333333333303'
);

UPDATE users
SET role = 'customer'
WHERE role = 'seller';

DROP INDEX IF EXISTS idx_order_items_seller_id;

ALTER TABLE order_items
	DROP COLUMN IF EXISTS seller_store_name,
	DROP COLUMN IF EXISTS seller_id;

DROP INDEX IF EXISTS idx_products_seller_id;

ALTER TABLE products
	DROP COLUMN IF EXISTS seller_id;

DROP TRIGGER IF EXISTS trg_seller_profiles_updated_at ON seller_profiles;
DROP INDEX IF EXISTS idx_seller_profiles_status;
DROP TABLE IF EXISTS seller_profiles;

ALTER TABLE users
	DROP CONSTRAINT IF EXISTS users_role_allowed;

ALTER TABLE users
	ADD CONSTRAINT users_role_allowed CHECK (role IN ('customer', 'admin'));
-- +goose StatementEnd
