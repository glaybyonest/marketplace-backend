package dto

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email,max=254"`
	Phone    string `json:"phone,omitempty" validate:"omitempty,max=32"`
	Password string `json:"password" validate:"required,min=8,max=72"`
	FullName string `json:"full_name" validate:"omitempty,max=120"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email,max=254"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required,min=20"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required,min=20"`
}

type VerifyEmailRequest struct {
	Email string `json:"email" validate:"required,email,max=254"`
}

type VerifyEmailConfirmRequest struct {
	Token string `json:"token" validate:"required,min=20"`
}

type PasswordResetRequest struct {
	Email string `json:"email" validate:"required,email,max=254"`
}

type PasswordResetConfirmRequest struct {
	Token       string `json:"token" validate:"required,min=20"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=72"`
}

type EmailCodeRequest struct {
	Email string `json:"email" validate:"required,email,max=254"`
}

type EmailCodeConfirmRequest struct {
	Email string `json:"email" validate:"required,email,max=254"`
	Code  string `json:"code" validate:"required,len=6,numeric"`
}

type PhoneCodeRequest struct {
	Phone string `json:"phone" validate:"required,min=10,max=32"`
}

type PhoneCodeConfirmRequest struct {
	Phone string `json:"phone" validate:"required,min=10,max=32"`
	Code  string `json:"code" validate:"required,len=6,numeric"`
}
