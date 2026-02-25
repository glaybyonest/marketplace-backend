package domain

// PageResult wraps paginated results.
type PageResult[T any] struct {
	Items []T `json:"items"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}
