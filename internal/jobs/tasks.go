package jobs

import (
	"context"
	"fmt"
	"time"

	"marketplace-backend/internal/mailer"
)

func (r *Runner) runCleanup(ctx context.Context) error {
	now := time.Now().UTC()

	var sessionsDeleted int64
	if r.sessions != nil {
		deleted, err := r.sessions.CleanupExpiredAndRevoked(ctx, now)
		if err != nil {
			return fmt.Errorf("cleanup sessions: %w", err)
		}
		sessionsDeleted = deleted
	}

	var tokensDeleted int64
	if r.actionTokens != nil {
		deleted, err := r.actionTokens.CleanupExpiredAndConsumed(ctx, now)
		if err != nil {
			return fmt.Errorf("cleanup action tokens: %w", err)
		}
		tokensDeleted = deleted
	}

	var emailRequeued int64
	var emailDeleted int64
	if r.emails != nil {
		requeued, err := r.emails.RequeueStaleProcessing(ctx, now.Add(-r.cfg.EmailLockTTL))
		if err != nil {
			return fmt.Errorf("requeue stale emails: %w", err)
		}
		emailRequeued = requeued

		deleted, err := r.emails.CleanupFinished(ctx, now.Add(-r.cfg.EmailRetention))
		if err != nil {
			return fmt.Errorf("cleanup finished emails: %w", err)
		}
		emailDeleted = deleted
	}

	r.logger.Info("background_cleanup_completed",
		"sessions_deleted", sessionsDeleted,
		"action_tokens_deleted", tokensDeleted,
		"emails_requeued", emailRequeued,
		"emails_deleted", emailDeleted,
	)
	return nil
}

func (r *Runner) runEmailDispatch(ctx context.Context) error {
	if r.emails == nil || r.emailSender == nil {
		return nil
	}

	now := time.Now().UTC()
	if _, err := r.emails.RequeueStaleProcessing(ctx, now.Add(-r.cfg.EmailLockTTL)); err != nil {
		return fmt.Errorf("requeue stale emails: %w", err)
	}

	jobs, err := r.emails.ClaimPending(ctx, now, r.cfg.EmailBatchSize)
	if err != nil {
		return fmt.Errorf("claim pending emails: %w", err)
	}
	if len(jobs) == 0 {
		return nil
	}

	sentCount := 0
	retryCount := 0
	failedCount := 0
	for _, job := range jobs {
		err := r.emailSender.Send(ctx, mailer.Message{
			To:      job.To,
			From:    job.From,
			Subject: job.Subject,
			Text:    job.Text,
		})
		if err == nil {
			if markErr := r.emails.MarkSent(ctx, job.ID, time.Now().UTC()); markErr != nil {
				return fmt.Errorf("mark email sent: %w", markErr)
			}
			sentCount++
			continue
		}

		if job.Attempts >= job.MaxAttempts {
			if markErr := r.emails.MarkFailed(ctx, job.ID, time.Now().UTC(), err.Error()); markErr != nil {
				return fmt.Errorf("mark email failed: %w", markErr)
			}
			failedCount++
			continue
		}

		nextAttempt := time.Now().UTC().Add(emailRetryDelay(job.Attempts))
		if markErr := r.emails.MarkRetry(ctx, job.ID, nextAttempt, err.Error()); markErr != nil {
			return fmt.Errorf("mark email retry: %w", markErr)
		}
		retryCount++
	}

	r.logger.Info("background_email_dispatch_completed",
		"claimed", len(jobs),
		"sent", sentCount,
		"retried", retryCount,
		"failed", failedCount,
	)
	return nil
}

func (r *Runner) runStatsRefresh(ctx context.Context) error {
	if r.recommendations == nil {
		return nil
	}
	rows, err := r.recommendations.RefreshPopularityStats(ctx)
	if err != nil {
		return fmt.Errorf("refresh popularity stats: %w", err)
	}
	r.logger.Info("background_stats_refresh_completed", "rows", rows)
	return nil
}

func (r *Runner) runRecommendationRefresh(ctx context.Context) error {
	if r.recommendations == nil {
		return nil
	}
	refreshedUsers, err := r.recommendations.RefreshCache(
		ctx,
		time.Now().UTC().Add(-r.cfg.RecommendationActivityWindow),
		r.cfg.RecommendationUserBatchSize,
		r.cfg.RecommendationLimit,
	)
	if err != nil {
		return fmt.Errorf("refresh recommendation cache: %w", err)
	}
	r.logger.Info("background_recommendations_refresh_completed", "users", refreshedUsers)
	return nil
}

func emailRetryDelay(attempt int) time.Duration {
	if attempt <= 0 {
		return 30 * time.Second
	}
	delay := time.Duration(attempt) * 30 * time.Second
	if delay > 10*time.Minute {
		return 10 * time.Minute
	}
	return delay
}
