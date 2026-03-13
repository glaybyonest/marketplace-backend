import styles from '@/components/common/AppLoader.module.scss'

interface AppLoaderProps {
  label?: string
}

export const AppLoader = ({ label = 'Loading...' }: AppLoaderProps) => (
  <div className={styles.loader} role="status" aria-live="polite">
    <span className={styles.spinner} aria-hidden />
    <span>{label}</span>
  </div>
)
