package jobs

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"marketplace-backend/internal/mailer"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type jobEmailQueueMock struct {
	claimedJobs       []mailer.Job
	claimedLimit      int
	markedSent        []uuid.UUID
	markedRetry       []uuid.UUID
	markedFailed      []uuid.UUID
	requeuedThreshold time.Time
}

func (m *jobEmailQueueMock) ClaimPending(ctx context.Context, now time.Time, limit int) ([]mailer.Job, error) {
	m.claimedLimit = limit
	return m.claimedJobs, nil
}

func (m *jobEmailQueueMock) MarkSent(ctx context.Context, id uuid.UUID, sentAt time.Time) error {
	m.markedSent = append(m.markedSent, id)
	return nil
}

func (m *jobEmailQueueMock) MarkRetry(ctx context.Context, id uuid.UUID, nextAttempt time.Time, lastError string) error {
	m.markedRetry = append(m.markedRetry, id)
	return nil
}

func (m *jobEmailQueueMock) MarkFailed(ctx context.Context, id uuid.UUID, failedAt time.Time, lastError string) error {
	m.markedFailed = append(m.markedFailed, id)
	return nil
}

func (m *jobEmailQueueMock) RequeueStaleProcessing(ctx context.Context, staleBefore time.Time) (int64, error) {
	m.requeuedThreshold = staleBefore
	return 0, nil
}

func (m *jobEmailQueueMock) CleanupFinished(ctx context.Context, finishedBefore time.Time) (int64, error) {
	return 0, nil
}

type jobSenderMock struct {
	send func(ctx context.Context, message mailer.Message) error
}

func (m *jobSenderMock) Send(ctx context.Context, message mailer.Message) error {
	if m.send == nil {
		return nil
	}
	return m.send(ctx, message)
}

type jobRecommendationMock struct{}

func (m *jobRecommendationMock) RefreshPopularityStats(ctx context.Context) (int64, error) {
	return 0, nil
}

func (m *jobRecommendationMock) RefreshCache(ctx context.Context, activeSince time.Time, userLimit, recommendationLimit int) (int, error) {
	return 0, nil
}

func TestRunEmailDispatch(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	job1 := mailer.Job{ID: uuid.New(), To: "a@example.com", From: "noreply@example.com", Subject: "ok", Text: "body", Attempts: 1, MaxAttempts: 3}
	job2 := mailer.Job{ID: uuid.New(), To: "b@example.com", From: "noreply@example.com", Subject: "retry", Text: "body", Attempts: 1, MaxAttempts: 3}
	job3 := mailer.Job{ID: uuid.New(), To: "c@example.com", From: "noreply@example.com", Subject: "fail", Text: "body", Attempts: 3, MaxAttempts: 3}

	queue := &jobEmailQueueMock{
		claimedJobs: []mailer.Job{job1, job2, job3},
	}
	senderCalls := 0
	sender := &jobSenderMock{send: func(ctx context.Context, message mailer.Message) error {
		senderCalls++
		switch message.Subject {
		case "retry":
			return errors.New("temporary failure")
		case "fail":
			return errors.New("permanent failure")
		default:
			return nil
		}
	}}

	runner := &Runner{
		logger:      logger,
		cfg:         Config{EmailBatchSize: 10, EmailLockTTL: 2 * time.Minute},
		emails:      queue,
		emailSender: sender,
	}

	err := runner.runEmailDispatch(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 10, queue.claimedLimit)
	assert.Len(t, queue.markedSent, 1)
	assert.Contains(t, queue.markedSent, job1.ID)
	assert.Len(t, queue.markedRetry, 1)
	assert.Contains(t, queue.markedRetry, job2.ID)
	assert.Len(t, queue.markedFailed, 1)
	assert.Contains(t, queue.markedFailed, job3.ID)
	assert.Equal(t, 3, senderCalls)
}
