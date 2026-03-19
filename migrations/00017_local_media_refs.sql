-- +goose Up
-- +goose StatementBegin
WITH seller_media (store_slug, logo_url, banner_url) AS (
	VALUES
		(
			'urbanwave',
			'marketplace-media://seller/urbanwave/logo',
			'marketplace-media://seller/urbanwave/banner'
		),
		(
			'casa-luna',
			'marketplace-media://seller/casa-luna/logo',
			'marketplace-media://seller/casa-luna/banner'
		),
		(
			'roam-fit',
			'marketplace-media://seller/roam-fit/logo',
			'marketplace-media://seller/roam-fit/banner'
		)
)
UPDATE seller_profiles sp
SET
	logo_url = seller_media.logo_url,
	banner_url = seller_media.banner_url
FROM seller_media
WHERE sp.store_slug = seller_media.store_slug;

WITH desired_product_media AS (
	SELECT
		p.id,
		'marketplace-media://product/' || p.slug || '/hero' AS image_url,
		jsonb_build_array(
			'marketplace-media://product/' || p.slug || '/hero',
			'marketplace-media://product/' || p.slug || '/detail',
			'marketplace-media://product/' || p.slug || '/lifestyle'
		) AS gallery
	FROM products p
	WHERE p.sku LIKE 'SEED-%'
		AND COALESCE(p.slug, '') <> ''
)
UPDATE products p
SET
	image_url = desired_product_media.image_url,
	gallery = desired_product_media.gallery
FROM desired_product_media
WHERE p.id = desired_product_media.id
	AND (
		p.image_url IS DISTINCT FROM desired_product_media.image_url
		OR p.gallery IS DISTINCT FROM desired_product_media.gallery
	);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
WITH seller_media (store_slug, logo_url, banner_url) AS (
	VALUES
		(
			'urbanwave',
			'https://placehold.co/240x240/10327a/f5f8ff?text=UW',
			'https://placehold.co/1440x480/102b62/e6f1ff?text=UrbanWave+Storefront'
		),
		(
			'casa-luna',
			'https://placehold.co/240x240/7a4210/fff5eb?text=CL',
			'https://placehold.co/1440x480/6a3710/fff0dd?text=Casa+Luna+Home'
		),
		(
			'roam-fit',
			'https://placehold.co/240x240/0f5b4f/ecfff9?text=RF',
			'https://placehold.co/1440x480/0d4b42/e4fff7?text=Roam+%26+Fit'
		)
)
UPDATE seller_profiles sp
SET
	logo_url = seller_media.logo_url,
	banner_url = seller_media.banner_url
FROM seller_media
WHERE sp.store_slug = seller_media.store_slug;

SELECT 1;
-- +goose StatementEnd
