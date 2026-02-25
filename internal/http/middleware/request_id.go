package middleware

import (
	"net/http"

	"marketplace-backend/internal/observability"
)

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = observability.NewRequestID()
		}

		ctx := observability.WithRequestID(r.Context(), requestID)
		w.Header().Set("X-Request-ID", requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
