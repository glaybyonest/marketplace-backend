import { useEffect, useMemo, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  createPlaceThunk,
  deletePlaceThunk,
  fetchPlacesThunk,
  reorderPlacesThunk,
  updatePlaceThunk,
} from '@/store/slices/placesSlice'

import styles from '@/pages/PlacesPage.module.scss'

interface PlaceFormState {
  title: string
  addressText: string
}

const emptyForm: PlaceFormState = {
  title: '',
  addressText: '',
}

export const PlacesPage = () => {
  const dispatch = useAppDispatch()
  const { items, status, mutationStatus, error } = useAppSelector((state) => state.places)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [form, setForm] = useState<PlaceFormState>(emptyForm)

  useEffect(() => {
    dispatch(fetchPlacesThunk())
  }, [dispatch])

  const formTitle = useMemo(
    () => (editingId ? 'Редактирование адреса' : 'Новый адрес доставки'),
    [editingId],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      title: form.title.trim(),
      addressText: form.addressText.trim(),
    }

    if (!payload.title || !payload.addressText) {
      return
    }

    if (editingId) {
      await dispatch(updatePlaceThunk({ id: editingId, data: payload }))
    } else {
      await dispatch(createPlaceThunk(payload))
    }

    setEditingId(null)
    setForm(emptyForm)
  }

  const startEdit = (id: string) => {
    const place = items.find((candidate) => candidate.id === id)
    if (!place) {
      return
    }

    setEditingId(id)
    setForm({
      title: place.title,
      addressText: place.addressText,
    })
  }

  const handleDelete = (id: string) => {
    void dispatch(deletePlaceThunk(id))
  }

  const resetDragState = () => {
    setDraggingId(null)
    setDropTargetId(null)
  }

  const handleDragStart = (event: DragEvent<HTMLElement>, id: string) => {
    if (items.length < 2) {
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    setDraggingId(id)
    setDropTargetId(id)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>, id: string) => {
    if (!draggingId || draggingId === id) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTargetId(id)
  }

  const handleDrop = async (event: DragEvent<HTMLElement>, overId: string) => {
    event.preventDefault()

    const activeId = draggingId || event.dataTransfer.getData('text/plain')
    if (!activeId || activeId === overId) {
      resetDragState()
      return
    }

    await dispatch(reorderPlacesThunk({ activeId, overId }))
    resetDragState()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="badge-pill">Адреса</span>
          <h1>Места доставки</h1>
        </div>
      </header>

      {status === 'loading' ? <AppLoader label="Загружаем адреса..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      <div className={styles.layout}>
        <section className={`${styles.formCard} page-card`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className="badge-pill">{editingId ? 'Редактирование' : 'Создание'}</span>
              <h2>{formTitle}</h2>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Название адреса
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Дом, офис, склад"
                required
              />
            </label>
            <label>
              Адрес
              <input
                value={form.addressText}
                onChange={(event) => setForm((prev) => ({ ...prev, addressText: event.target.value }))}
                placeholder="Полный адрес для доставки"
                required
              />
            </label>

            <div className={styles.actions}>
              <button type="submit" className="action-primary" disabled={mutationStatus === 'loading'}>
                {editingId ? 'Сохранить адрес' : 'Добавить адрес'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="action-secondary"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm)
                  }}
                >
                  Отменить
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className={styles.list}>
          {items.length === 0 && status !== 'loading' ? (
            <div className={`${styles.empty} empty-state`}>
              <h2>Адресов пока нет</h2>
              <p>Добавьте первое место доставки, чтобы использовать его при оформлении заказа.</p>
            </div>
          ) : null}

          {items.map((place, index) => {
            const isPrimary = index === 0
            const isDragging = draggingId === place.id
            const isDropTarget = dropTargetId === place.id && draggingId !== place.id

            return (
              <article
                className={`${styles.item} ${isPrimary ? styles.itemPrimary : ''} ${isDragging ? styles.itemDragging : ''} ${isDropTarget ? styles.itemDropTarget : ''}`}
                key={place.id}
                draggable={items.length > 1}
                onDragStart={(event) => handleDragStart(event, place.id)}
                onDragOver={(event) => handleDragOver(event, place.id)}
                onDrop={(event) => void handleDrop(event, place.id)}
                onDragEnd={resetDragState}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemBadge}>{isPrimary ? 'Основной адрес' : 'Дополнительный'}</span>
                    <small>{isPrimary ? 'Используется по умолчанию' : 'Можно поднять выше перетаскиванием'}</small>
                  </div>
                  <div>
                    <h3>{place.title}</h3>
                    <p>{place.addressText}</p>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className="action-secondary" onClick={() => startEdit(place.id)}>
                    Изменить
                  </button>
                  <button type="button" className="action-danger" onClick={() => handleDelete(place.id)}>
                    Удалить
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
