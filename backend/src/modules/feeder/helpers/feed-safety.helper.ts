export interface SafetyConfig {
  minDurationMs: number;
  maxDurationMs: number;
  cooldownSeconds: number;
}

export const DEFAULT_SAFETY: SafetyConfig = {
  minDurationMs: 200,
  maxDurationMs: 180000,
  cooldownSeconds: 3,
};

/**
 * Validates whether the requested food feeding duration is within safe physical operating limits.
 */
export function validateDurationBounds(
  durationMs: number,
  config: SafetyConfig = DEFAULT_SAFETY,
): { valid: boolean; clampedDuration: number; reason?: string } {
  if (isNaN(durationMs)) {
    return {
      valid: false,
      clampedDuration: config.minDurationMs,
      reason: 'Duration must be a valid number',
    };
  }

  if (durationMs < config.minDurationMs) {
    return {
      valid: false,
      clampedDuration: config.minDurationMs,
      reason: `Duration ${durationMs}ms is below hardware minimum of ${config.minDurationMs}ms`,
    };
  }

  if (durationMs > config.maxDurationMs) {
    return {
      valid: false,
      clampedDuration: config.maxDurationMs,
      reason: `Duration ${durationMs}ms exceeds hardware safety cap of ${config.maxDurationMs}ms`,
    };
  }

  return { valid: true, clampedDuration: durationMs };
}

/**
 * Evaluates whether consecutive feeds violate motor cooldown.
 */
export function isCooldownViolated(
  lastFeedTimestamp: number,
  currentTimestamp: number,
  cooldownSeconds: number = DEFAULT_SAFETY.cooldownSeconds,
): { inCooldown: boolean; remainingSeconds: number } {
  if (!lastFeedTimestamp) return { inCooldown: false, remainingSeconds: 0 };

  const elapsedSeconds = Math.floor((currentTimestamp - lastFeedTimestamp) / 1000);
  if (elapsedSeconds < cooldownSeconds) {
    return {
      inCooldown: true,
      remainingSeconds: cooldownSeconds - elapsedSeconds,
    };
  }

  return { inCooldown: false, remainingSeconds: 0 };
}
