import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  createPlaceThunk,
  deletePlaceThunk,
  fetchPlacesThunk,
  updatePlaceThunk,
} from '@/store/slices/placesSlice'

import styles from '@/pages/PlacesPage.module.scss'

interface PlaceFormState {
  title: string
  addressText: string
  lat: string
  lon: string
}

const emptyForm: PlaceFormState = {
  title: '',
  addressText: '',
  lat: '',
  lon: '',
}

export const PlacesPage = () => {
  const dispatch = useAppDispatch()
  const { items, status, mutationStatus, error } = useAppSelector((state) => state.places)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlaceFormState>(emptyForm)

  useEffect(() => {
    dispatch(fetchPlacesThunk())
  }, [dispatch])

  const title = useMemo(() => (editingId ? 'Edit place' : 'Add place'), [editingId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      title: form.title.trim(),
      addressText: form.addressText.trim(),
      lat: form.lat ? Number(form.lat) : undefined,
      lon: form.lon ? Number(form.lon) : undefined,
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
      lat: place.lat === undefined ? '' : String(place.lat),
      lon: place.lon === undefined ? '' : String(place.lon),
    })
  }

  const handleDelete = (id: string) => {
    dispatch(deletePlaceThunk(id))
  }

  return (
    <div className={styles.page}>
      <h1>My places</h1>

      {status === 'loading' ? <AppLoader label="Loading places..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      <section className={styles.formCard}>
        <h2>{title}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Title"
            required
          />
          <input
            value={form.addressText}
            onChange={(event) => setForm((prev) => ({ ...prev, addressText: event.target.value }))}
            placeholder="Address"
            required
          />
          <div className={styles.row}>
            <input
              value={form.lat}
              onChange={(event) => setForm((prev) => ({ ...prev, lat: event.target.value }))}
              placeholder="Latitude"
            />
            <input
              value={form.lon}
              onChange={(event) => setForm((prev) => ({ ...prev, lon: event.target.value }))}
              placeholder="Longitude"
            />
          </div>
          <div className={styles.actions}>
            <button type="submit" disabled={mutationStatus === 'loading'}>
              {editingId ? 'Save' : 'Create'}
            </button>
            {editingId ? (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={styles.list}>
        {items.map((place) => (
          <article className={styles.item} key={place.id}>
            <div>
              <h3>{place.title}</h3>
              <p>{place.addressText}</p>
              {place.lat !== undefined && place.lon !== undefined ? (
                <small>
                  {place.lat}, {place.lon}
                </small>
              ) : null}
            </div>
            <div className={styles.actions}>
              <button type="button" onClick={() => startEdit(place.id)}>
                Edit
              </button>
              <button type="button" className={styles.danger} onClick={() => handleDelete(place.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
