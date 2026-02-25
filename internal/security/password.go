package security

import "golang.org/x/crypto/bcrypt"

// PasswordManager hashes and verifies passwords.
type PasswordManager struct {
	cost int
}

func NewPasswordManager() *PasswordManager {
	return &PasswordManager{cost: bcrypt.DefaultCost}
}

func (m *PasswordManager) Hash(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), m.cost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

func (m *PasswordManager) Compare(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
