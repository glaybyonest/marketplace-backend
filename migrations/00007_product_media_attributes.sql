-- +goose Up
-- +goose StatementBegin
ALTER TABLE products
	ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
	ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
	ADD COLUMN IF NOT EXISTS brand TEXT NULL,
	ADD COLUMN IF NOT EXISTS unit TEXT NULL,
	ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH product_updates (id, image_url, gallery, brand, unit, specs) AS (
	VALUES
		(
			'22222222-2222-2222-2222-222222222201'::uuid,
			'https://placehold.co/1200x900/e7f0ff/1d4f91?text=Cement+M500+25kg',
			'["https://placehold.co/1200x900/f5f8ff/315d9b?text=Portland+Cement","https://placehold.co/1200x900/edf6ea/2f6b2f?text=25kg+Bag"]'::jsonb,
			'EuroMix',
			'bag',
			'{"weight":"25 kg","grade":"M500","application":"foundation and screed","composition":"Portland cement"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222202'::uuid,
			'https://placehold.co/1200x900/e8efff/254f8e?text=Cement+M400+50kg',
			'["https://placehold.co/1200x900/f6f8ff/3b66a8?text=Universal+Mix","https://placehold.co/1200x900/f1ece4/7d5c2e?text=50kg+Bag"]'::jsonb,
			'BuildStone',
			'bag',
			'{"weight":"50 kg","grade":"M400","application":"concrete and masonry","setting_time":"standard"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222203'::uuid,
			'https://placehold.co/1200x900/eaf2ff/295291?text=Cement+Mix+40kg',
			'["https://placehold.co/1200x900/f5f8ff/426ca7?text=Dry+Mix","https://placehold.co/1200x900/efe9df/73552a?text=Ready+for+Plaster"]'::jsonb,
			'MasterBlend',
			'bag',
			'{"weight":"40 kg","type":"dry cement mix","application":"plaster and masonry","indoor_outdoor":"both"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222204'::uuid,
			'https://placehold.co/1200x900/f2e6d8/6f4a1f?text=Oak+Board+50x150x3000',
			'["https://placehold.co/1200x900/f7efe6/8a5b27?text=Solid+Oak","https://placehold.co/1200x900/e8dcc9/5f3f1c?text=Planed+Surface"]'::jsonb,
			'NordWood',
			'board',
			'{"dimensions":"50x150x3000 mm","species":"oak","finish":"planed","use":"structural and finish carpentry"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222205'::uuid,
			'https://placehold.co/1200x900/f0e3d4/744a20?text=Oak+Beam+100x100x3000',
			'["https://placehold.co/1200x900/f8efe4/8d5d2b?text=Oak+Beam","https://placehold.co/1200x900/e4d6c3/5b3a18?text=Load+Bearing"]'::jsonb,
			'NordWood',
			'piece',
			'{"dimensions":"100x100x3000 mm","species":"oak","strength":"high","use":"framing and supports"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222206'::uuid,
			'https://placehold.co/1200x900/f4efe7/7b5d34?text=Aspen+Board+25x100x3000',
			'["https://placehold.co/1200x900/f9f4ed/8e7041?text=Light+Aspen","https://placehold.co/1200x900/ede4d8/6a4f2c?text=Interior+Use"]'::jsonb,
			'Siberia Timber',
			'board',
			'{"dimensions":"25x100x3000 mm","species":"aspen","weight":"light","use":"interior trim"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222207'::uuid,
			'https://placehold.co/1200x900/f2ecdf/7d6236?text=Aspen+Panel+14x96x2000',
			'["https://placehold.co/1200x900/f8f2e7/977647?text=Sauna+Panel","https://placehold.co/1200x900/ede3d1/6b542f?text=Smooth+Tongue+and+Groove"]'::jsonb,
			'Siberia Timber',
			'panel',
			'{"dimensions":"14x96x2000 mm","species":"aspen","profile":"tongue and groove","use":"bath and sauna finishing"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222208'::uuid,
			'https://placehold.co/1200x900/f2eadc/80663b?text=Birch+Plywood+12mm',
			'["https://placehold.co/1200x900/f7f1e7/96784a?text=FK+Plywood","https://placehold.co/1200x900/ece2d2/6e5530?text=Birch+Sheet"]'::jsonb,
			'Baltic Board',
			'sheet',
			'{"thickness":"12 mm","material":"birch plywood","grade":"FK","use":"furniture and interior work"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222209'::uuid,
			'https://placehold.co/1200x900/f3eadd/7d6135?text=Birch+Board+40x120x3000',
			'["https://placehold.co/1200x900/f7f0e5/957445?text=Birch+Board","https://placehold.co/1200x900/ede2d1/6c542f?text=Trimmed+Edge"]'::jsonb,
			'Baltic Board',
			'board',
			'{"dimensions":"40x120x3000 mm","species":"birch","edge":"trimmed","use":"general carpentry"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222210'::uuid,
			'https://placehold.co/1200x900/e4e8ee/3d4858?text=Construction+Nails+100mm',
			'["https://placehold.co/1200x900/f0f3f7/596577?text=Steel+Nails","https://placehold.co/1200x900/e7ebf2/4b5668?text=5kg+Pack"]'::jsonb,
			'SteelFix',
			'pack',
			'{"length":"100 mm","weight":"5 kg","material":"steel","use":"general structural fastening"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222211'::uuid,
			'https://placehold.co/1200x900/e6eaef/455061?text=Finish+Nails+40mm',
			'["https://placehold.co/1200x900/f1f4f8/5e6a7a?text=Finish+Head","https://placehold.co/1200x900/e9edf3/4e5a69?text=1kg+Pack"]'::jsonb,
			'SteelFix',
			'pack',
			'{"length":"40 mm","weight":"1 kg","head":"finish","use":"interior finishing"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222212'::uuid,
			'https://placehold.co/1200x900/e7ebf1/495468?text=Zinc+Nails+70mm',
			'["https://placehold.co/1200x900/f0f4f8/607081?text=Galvanized","https://placehold.co/1200x900/e5e9ef/4a5768?text=Outdoor+Use"]'::jsonb,
			'SteelFix',
			'pack',
			'{"length":"70 mm","weight":"2 kg","coating":"zinc","use":"exterior fastening"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222213'::uuid,
			'https://placehold.co/1200x900/e3efff/1f4f97?text=Cement+M600+25kg',
			'["https://placehold.co/1200x900/f2f7ff/3e6aa7?text=High+Strength","https://placehold.co/1200x900/edf4e8/336a34?text=25kg+Bag"]'::jsonb,
			'EuroMix',
			'bag',
			'{"weight":"25 kg","grade":"M600","application":"high-load concrete","strength":"high"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222214'::uuid,
			'https://placehold.co/1200x900/f1e4d5/764d22?text=Oak+Planken+20x140x3000',
			'["https://placehold.co/1200x900/f8efe5/8f5f2d?text=Facade+Planken","https://placehold.co/1200x900/e7dbc8/62401d?text=Oak+Texture"]'::jsonb,
			'NordWood',
			'board',
			'{"dimensions":"20x140x3000 mm","species":"oak","profile":"planken","use":"facade and decorative cladding"}'::jsonb
		),
		(
			'22222222-2222-2222-2222-222222222215'::uuid,
			'https://placehold.co/1200x900/f2eadf/84663a?text=Birch+Veneer+0.6mm',
			'["https://placehold.co/1200x900/f8f1e7/98784a?text=Decorative+Veneer","https://placehold.co/1200x900/ece1cf/70552e?text=Flexible+Sheet"]'::jsonb,
			'Baltic Board',
			'sheet',
			'{"thickness":"0.6 mm","material":"birch veneer","use":"furniture finishing","surface":"decorative"}'::jsonb
		)
)
UPDATE products p
SET
	image_url = product_updates.image_url,
	gallery = product_updates.gallery,
	brand = product_updates.brand,
	unit = product_updates.unit,
	specs = product_updates.specs
FROM product_updates
WHERE p.id = product_updates.id;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE products
	DROP COLUMN IF EXISTS specs,
	DROP COLUMN IF EXISTS unit,
	DROP COLUMN IF EXISTS brand,
	DROP COLUMN IF EXISTS gallery,
	DROP COLUMN IF EXISTS image_url;
-- +goose StatementEnd
