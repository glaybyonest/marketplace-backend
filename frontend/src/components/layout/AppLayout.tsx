import type { ReactNode } from 'react'

import { Header } from '@/components/layout/Header'

import styles from '@/components/layout/AppLayout.module.scss'

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.content}>{children}</main>
  </div>
)
