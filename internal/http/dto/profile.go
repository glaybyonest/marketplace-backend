package dto

type UpdateProfileRequest struct {
	FullName *string `json:"full_name,omitempty" validate:"omitempty,max=120"`
	Phone    *string `json:"phone,omitempty" validate:"omitempty,max=32"`
}
