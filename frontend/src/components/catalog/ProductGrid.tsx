import type { Product } from '@/types/domain'

import { ProductCard } from '@/components/catalog/ProductCard'

import styles from '@/components/catalog/ProductGrid.module.scss'

interface ProductGridProps {
  products: Product[]
}

export const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return <p className={styles.empty}>По выбранным фильтрам пока ничего не найдено.</p>
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
