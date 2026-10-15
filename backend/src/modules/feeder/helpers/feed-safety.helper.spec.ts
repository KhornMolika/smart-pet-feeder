import { describe, it, expect } from 'vitest';
import {
  validateDurationBounds,
  isCooldownViolated,
  DEFAULT_SAFETY,
} from './feed-safety.helper.js';

describe('FeedSafetyHelper (Zero-Mock Unit Tests)', () => {
  describe('validateDurationBounds', () => {
    it('should accept duration within safety boundaries (700ms)', () => {
      const res = validateDurationBounds(700);
      expect(res.valid).toBe(true);
      expect(res.clampedDuration).toBe(700);
      expect(res.reason).toBeUndefined();
    });

    it('should reject and clamp duration below minimum hardware limit (100ms < 200ms)', () => {
      const res = validateDurationBounds(100);
      expect(res.valid).toBe(false);
      expect(res.clampedDuration).toBe(DEFAULT_SAFETY.minDurationMs);
      expect(res.reason).toContain('below hardware minimum');
    });

    it('should reject and clamp duration exceeding safety cap (200000ms > 180000ms)', () => {
      const res = validateDurationBounds(200000);
      expect(res.valid).toBe(false);
      expect(res.clampedDuration).toBe(DEFAULT_SAFETY.maxDurationMs);
      expect(res.reason).toContain('exceeds hardware safety cap');
    });

    it('should reject NaN duration', () => {
      const res = validateDurationBounds(NaN);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('Duration must be a valid number');
    });
  });

  describe('isCooldownViolated', () => {
    it('should allow feed if no prior feed recorded (timestamp = 0)', () => {
      const res = isCooldownViolated(0, Date.now());
      expect(res.inCooldown).toBe(false);
      expect(res.remainingSeconds).toBe(0);
    });

    it('should enforce cooldown if last feed was 1 second ago (< 3s)', () => {
      const now = Date.now();
      const lastFeed = now - 1000; // 1s ago
      const res = isCooldownViolated(lastFeed, now, 3);
      expect(res.inCooldown).toBe(true);
      expect(res.remainingSeconds).toBe(2);
    });

    it('should allow feed if elapsed time exceeds cooldown (4s > 3s)', () => {
      const now = Date.now();
      const lastFeed = now - 4000; // 4s ago
      const res = isCooldownViolated(lastFeed, now, 3);
      expect(res.inCooldown).toBe(false);
      expect(res.remainingSeconds).toBe(0);
    });
  });
});
