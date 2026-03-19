import { type CSSProperties } from 'react'

import { getCategoryIconMarkup, type CategoryIconKey } from '@/utils/categoryIcons'

interface CategoryIconProps {
  iconKey: CategoryIconKey
  accent?: string
  className?: string
}

export const CategoryIcon = ({ iconKey, accent, className }: CategoryIconProps) => (
  <span
    aria-hidden="true"
    className={className}
    style={{ '--category-accent': accent } as CSSProperties}
    dangerouslySetInnerHTML={{
      __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${getCategoryIconMarkup(iconKey)}</svg>`,
    }}
  />
)
