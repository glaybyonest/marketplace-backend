package dto

type UpdateProfileRequest struct {
	FullName *string `json:"full_name,omitempty" validate:"omitempty,max=120"`
}
