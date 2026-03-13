# Marketplace Frontend

Frontend for `marketplace-backend` (`React + Vite + TypeScript`).

## Supported backend features
- Auth: register/login/refresh/logout
- Profile: get/update
- Catalog: categories + products (search/sort/pagination)
- Favorites
- Places (saved addresses)
- Recommendations

## Local setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env` from `.env.example`:
```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```
3. Run frontend:
```bash
npm run dev
```

Vite proxy forwards `/api`, `/healthz`, `/readyz` to backend (`localhost:8080`).

## Scripts
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`
- `npm run test:watch`
- `npm run format`
- `npm run format:check`

## Main routes
- Public: `/`, `/products/:id`, `/login`, `/register`
- Protected: `/account`, `/favorites`, `/account/places`

Legacy routes are redirected:
- `/cart` -> `/favorites`
- `/checkout` and `/account/orders` -> `/account/places`
