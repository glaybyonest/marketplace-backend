package middleware

import (
	"fmt"
	"log/slog"
	"net/http"

	"marketplace-backend/internal/http/response"
)

func Recoverer(logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if recovered := recover(); recovered != nil {
					logger.Error(
						"http_panic",
						"panic", fmt.Sprint(recovered),
						"path", r.URL.Path,
						"method", r.Method,
					)
					response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
