# Marketplace Backend

## Требования
- Go 1.24+
- Docker (Docker Desktop на Windows)
- Make (опционально, но удобно)

## Установка
1. Создайте файл `.env` на основе `.env.example` и задайте `JWT_SECRET` (минимум 32 символа).
2. Для локального запуска (вне Docker) используйте `DATABASE_URL` с хостом `localhost`.
3. Для запуска в Docker используйте `DATABASE_URL` с хостом `postgres` (как в `.env.example`).

## Запуск в Docker
1. Поднять сервисы:
```bash
docker compose up -d --build
```
2. Проверить статус:
```bash
docker compose ps
```
3. Остановить и удалить тома:
```bash
docker compose down -v
```

## База данных
- Контейнер Postgres создаёт базы `marketplace` и `marketplace_test` при первом старте.
- Если том `postgres_data` уже существует и `marketplace_test` нет, выполните:
```bash
docker compose exec postgres createdb -U postgres marketplace_test
```

## Миграции
Миграции запускаются с хоста (Goose выполняется локально):
```bash
DB_URL=postgres://postgres:postgres@localhost:5432/marketplace?sslmode=disable make migrate-up
```
Откат:
```bash
DB_URL=postgres://postgres:postgres@localhost:5432/marketplace?sslmode=disable make migrate-down
```

## Запуск без Docker
1. Убедитесь, что `DATABASE_URL` указывает на локальный Postgres.
2. Запустите сервис:
```bash
go run ./cmd/api
```

## Тесты
```bash
go test ./... -race -coverprofile=coverage.out
```
Если есть интеграционные тесты, `TEST_DATABASE_URL` должен указывать на `marketplace_test`
(обычно `postgres://postgres:postgres@localhost:5432/marketplace_test?sslmode=disable`).

## Использование
Базовый адрес по умолчанию: `http://localhost:8080`
- `GET /healthz`
- `GET /readyz`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout` (auth)
- `GET /api/v1/auth/me` (auth)
- `GET /api/v1/categories`
- `GET /api/v1/categories/slug/{slug}`
- `GET /api/v1/categories/{id}`
- `GET /api/v1/products`
- `GET /api/v1/products/slug/{slug}`
- `GET /api/v1/products/{id}`
- `GET /api/v1/profile` (auth)
- `PATCH /api/v1/profile` (auth)
- `GET /api/v1/favorites` (auth)
- `POST /api/v1/favorites/{product_id}` (auth)
- `DELETE /api/v1/favorites/{product_id}` (auth)
- `POST /api/v1/places` (auth)
- `GET /api/v1/places` (auth)
- `PATCH /api/v1/places/{id}` (auth)
- `DELETE /api/v1/places/{id}` (auth)
- `GET /api/v1/recommendations` (auth)