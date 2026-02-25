package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"marketplace-backend/internal/observability"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func Logger(logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			startedAt := time.Now()
			rec := &statusRecorder{
				ResponseWriter: w,
				status:         http.StatusOK,
			}

			next.ServeHTTP(rec, r)

			logger.Info(
				"http_request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", rec.status,
				"duration_ms", time.Since(startedAt).Milliseconds(),
				"request_id", observability.RequestIDFromContext(r.Context()),
				"remote_addr", r.RemoteAddr,
			)
		})
	}
}
