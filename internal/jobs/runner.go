package jobs

import (
	"context"
	"log/slog"
	"time"

	"marketplace-backend/internal/mailer"

	"github.com/google/uuid"
)

type Config struct {
	Enabled                       bool
	CleanupInterval               time.Duration
	EmailPollInterval             time.Duration
	EmailLockTTL                  time.Duration
	EmailBatchSize                int
	EmailRetention                time.Duration
	StatsRefreshInterval          time.Duration
	RecommendationRefreshInterval time.Duration
	RecommendationActivityWindow  time.Duration
	RecommendationUserBatchSize   int
	RecommendationLimit           int
}

type SessionCleaner interface {
	CleanupExpiredAndRevoked(ctx context.Context, now time.Time) (int64, error)
}

type ActionTokenCleaner interface {
	CleanupExpiredAndConsumed(ctx context.Context, now time.Time) (int64, error)
}

type EmailQueue interface {
	ClaimPending(ctx context.Context, now time.Time, limit int) ([]mailer.Job, error)
	MarkSent(ctx context.Context, id uuid.UUID, sentAt time.Time) error
	MarkRetry(ctx context.Context, id uuid.UUID, nextAttempt time.Time, lastError string) error
	MarkFailed(ctx context.Context, id uuid.UUID, failedAt time.Time, lastError string) error
	RequeueStaleProcessing(ctx context.Context, staleBefore time.Time) (int64, error)
	CleanupFinished(ctx context.Context, finishedBefore time.Time) (int64, error)
}

type RecommendationRefresher interface {
	RefreshPopularityStats(ctx context.Context) (int64, error)
	RefreshCache(ctx context.Context, activeSince time.Time, userLimit, recommendationLimit int) (int, error)
}

type Runner struct {
	logger          *slog.Logger
	cfg             Config
	sessions        SessionCleaner
	actionTokens    ActionTokenCleaner
	emails          EmailQueue
	emailSender     mailer.Sender
	recommendations RecommendationRefresher
}

func NewRunner(
	logger *slog.Logger,
	cfg Config,
	sessions SessionCleaner,
	actionTokens ActionTokenCleaner,
	emails EmailQueue,
	emailSender mailer.Sender,
	recommendations RecommendationRefresher,
) *Runner {
	return &Runner{
		logger:          logger,
		cfg:             cfg,
		sessions:        sessions,
		actionTokens:    actionTokens,
		emails:          emails,
		emailSender:     emailSender,
		recommendations: recommendations,
	}
}

func (r *Runner) Start(ctx context.Context) {
	if r == nil || !r.cfg.Enabled {
		return
	}

	go r.loop(ctx, "cleanup", r.cfg.CleanupInterval, r.runCleanup)
	go r.loop(ctx, "email_dispatch", r.cfg.EmailPollInterval, r.runEmailDispatch)
	go r.loop(ctx, "stats_refresh", r.cfg.StatsRefreshInterval, r.runStatsRefresh)
	go r.loop(ctx, "recommendations_refresh", r.cfg.RecommendationRefreshInterval, r.runRecommendationRefresh)
}

func (r *Runner) loop(ctx context.Context, name string, interval time.Duration, fn func(context.Context) error) {
	if interval <= 0 {
		return
	}

	runOnce := func() {
		if err := fn(ctx); err != nil && ctx.Err() == nil {
			r.logger.Error("background_job_failed", "job", name, "error", err)
		}
	}

	runOnce()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			runOnce()
		}
	}
}
