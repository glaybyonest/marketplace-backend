package mailer

import (
	"context"
	"log/slog"
)

type Message struct {
	To      string
	From    string
	Subject string
	Text    string
}

type Sender interface {
	Send(ctx context.Context, message Message) error
}

type LogSender struct {
	logger *slog.Logger
}

func NewLogSender(logger *slog.Logger) *LogSender {
	return &LogSender{logger: logger}
}

func (s *LogSender) Send(ctx context.Context, message Message) error {
	s.logger.InfoContext(ctx, "email dispatched",
		"to", message.To,
		"from", message.From,
		"subject", message.Subject,
		"text", message.Text,
	)
	return nil
}
