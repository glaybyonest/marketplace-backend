import { useState, useRef } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

import styles from '@/components/catalog/SearchBar.module.scss'

interface SearchBarProps {
  initialValue?: string
  onSearch: (value: string) => void
}

export const SearchBar = ({ initialValue = '', onSearch }: SearchBarProps) => {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(value.trim())
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
    onSearch('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleClear()
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск по товарам..."
          aria-label="Поиск по товарам"
        />
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <button
          type="button"
          className={`${styles.clearButton} ${value ? styles.clearButtonVisible : ''}`}
          onClick={handleClear}
          aria-label="Очистить поиск"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <button className={styles.button} type="submit">
        <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className={styles.buttonText}>Найти</span>
      </button>
    </form>
  )
}
