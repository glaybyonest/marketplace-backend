import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AdminNav } from '@/components/admin/AdminNav'
import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { categoryService } from '@/services/categoryService'
import type { Category } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/AdminPage.module.scss'

interface CategoryFormState {
  name: string
  slug: string
  parentId: string
}

const initialFormState: CategoryFormState = {
  name: '',
  slug: '',
  parentId: '',
}

export const AdminCategoriesPage = () => {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CategoryFormState>(initialFormState)

  const categoryMap = useMemo(
    () => new Map(items.map((category) => [category.id, category])),
    [items],
  )

  const parentOptions = useMemo(
    () => items.filter((category) => category.id !== editingId),
    [editingId, items],
  )

  const loadCategories = async () => {
    setLoading(true)
    setError(null)

    try {
      const nextItems = await categoryService.getCategories()
      setItems(nextItems)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Не удалось загрузить категории'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setFormState(initialFormState)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        name: formState.name,
        slug: formState.slug || undefined,
        parentId: formState.parentId || undefined,
      }

      if (editingId) {
        await categoryService.updateCategory(editingId, payload)
      } else {
        await categoryService.createCategory(payload)
      }

      await loadCategories()
      resetForm()
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Не удалось сохранить категорию'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormState({
      name: category.name,
      slug: category.slug ?? '',
      parentId: category.parentId ?? '',
    })
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Удалить категорию «${category.name}»?`)) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await categoryService.deleteCategory(category.id)
      await loadCategories()
      if (editingId === category.id) {
        resetForm()
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Не удалось удалить категорию'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className="badge-pill">Категории</span>
          <h1>Структура каталога</h1>
          <p>Поддерживайте дерево категорий, slug-и и родительские связи, на которые опираются каталог, фильтры и быстрые ссылки в шапке.</p>
        </div>
        <AdminNav />
      </section>

      {loading ? <AppLoader label="Загружаем категории..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <h2>{editingId ? 'Редактирование категории' : 'Новая категория'}</h2>
          <p>Slug можно оставить пустым, тогда сервер сформирует его автоматически. Родительская категория необязательна.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Название
              <input
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Электроника"
                required
              />
            </label>

            <label>
              Slug
              <input
                value={formState.slug}
                onChange={(event) => setFormState((current) => ({ ...current, slug: event.target.value }))}
                placeholder="electronics"
              />
            </label>

            <label>
              Родительская категория
              <select
                value={formState.parentId}
                onChange={(event) => setFormState((current) => ({ ...current, parentId: event.target.value }))}
              >
                <option value="">Корневая категория</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Сохраняем...' : editingId ? 'Обновить категорию' : 'Создать категорию'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={resetForm} disabled={submitting}>
                Сбросить форму
              </button>
            </div>
          </form>
        </article>

        <article className={styles.panel}>
          <div className={styles.toolbar}>
            <div>
              <h2>Текущие категории</h2>
              <p>Загружено: {items.length}</p>
            </div>
          </div>

          {items.length === 0 && !loading ? (
            <div className={styles.empty}>
              <h2>Категорий пока нет</h2>
              <p>Создайте первую категорию с помощью формы слева.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {items.map((category) => {
                const parentName = category.parentId ? categoryMap.get(category.parentId)?.name ?? 'Неизвестный родитель' : 'Корень'
                return (
                  <article key={category.id} className={styles.listCard}>
                    <div className={styles.listHeader}>
                      <div>
                        <h3>{category.name}</h3>
                        <p className={styles.listMeta}>Slug: {category.slug ?? '-'} • Родитель: {parentName}</p>
                      </div>
                      <div className={styles.rowActions}>
                        <button type="button" className={styles.ghostButton} onClick={() => handleEdit(category)}>
                          Изменить
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleDelete(category)}
                          disabled={submitting}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
