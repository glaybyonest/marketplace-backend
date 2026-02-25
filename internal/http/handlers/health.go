package handlers

import (
	"context"
	"net/http"
	"time"

	"marketplace-backend/internal/http/response"
)

type DBPinger interface {
	Ping(ctx context.Context) error
}

type HealthHandler struct {
	db DBPinger
}

func NewHealthHandler(db DBPinger) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Healthz(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

func (h *HealthHandler) Readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.db.Ping(ctx); err != nil {
		response.Error(w, http.StatusServiceUnavailable, "not_ready", "database is not ready", nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"status": "ready",
	})
}
