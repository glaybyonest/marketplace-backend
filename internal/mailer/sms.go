package mailer

import (
	"context"
	"log/slog"
)

type SMSMessage struct {
	To   string
	Text string
}

type SMSSender interface {
	Send(ctx context.Context, message SMSMessage) error
}

type LogSMSSender struct {
	logger *slog.Logger
}

func NewLogSMSSender(logger *slog.Logger) *LogSMSSender {
	return &LogSMSSender{logger: logger}
}

func (s *LogSMSSender) Send(ctx context.Context, message SMSMessage) error {
	s.logger.InfoContext(ctx, "sms dispatched",
		"to", message.To,
		"text", message.Text,
	)
	return nil
}
