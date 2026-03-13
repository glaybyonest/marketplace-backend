import { Component, type ErrorInfo, type ReactNode } from 'react'

import styles from '@/components/common/ErrorBoundary.module.scss'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError() {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unexpected app error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback}>
          <h2>Что-то пошло не так</h2>
          <p>Попробуйте обновить страницу.</p>
        </div>
      )
    }

    return this.props.children
  }
}
