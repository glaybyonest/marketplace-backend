import styles from '@/components/common/ErrorMessage.module.scss'

interface ErrorMessageProps {
  message: string
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => (
  <p className={styles.error} role="alert">
    {message}
  </p>
)
