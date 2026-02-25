package handlers

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/http/response"

	"github.com/go-playground/validator/v10"
)

func decodeAndValidate(r *http.Request, dst any, validate *validator.Validate) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return domain.ErrInvalidInput
	}
	if decoder.More() {
		return domain.ErrInvalidInput
	}
	if err := validate.Struct(dst); err != nil {
		return domain.ErrInvalidInput
	}
	return nil
}

func writeDomainError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}
	response.FromDomainError(w, err)
}

func getClientIP(r *http.Request) string {
	forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil {
		return host
	}
	if errors.Is(err, net.ErrClosed) {
		return ""
	}
	return strings.TrimSpace(r.RemoteAddr)
}
