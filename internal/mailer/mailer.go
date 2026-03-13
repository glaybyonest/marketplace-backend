package mailer

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
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

type Job struct {
	ID          uuid.UUID
	To          string
	From        string
	Subject     string
	Text        string
	Status      string
	Attempts    int
	MaxAttempts int
	AvailableAt time.Time
	LockedAt    *time.Time
	LastError   string
	SentAt      *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type QueueWriter interface {
	Enqueue(ctx context.Context, message Message, maxAttempts int) error
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

type QueueSender struct {
	queue       QueueWriter
	maxAttempts int
}

func NewQueueSender(queue QueueWriter, maxAttempts int) *QueueSender {
	if maxAttempts <= 0 {
		maxAttempts = 5
	}
	return &QueueSender{
		queue:       queue,
		maxAttempts: maxAttempts,
	}
}

func (s *QueueSender) Send(ctx context.Context, message Message) error {
	return s.queue.Enqueue(ctx, message, s.maxAttempts)
}
