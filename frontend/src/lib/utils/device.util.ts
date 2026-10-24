/**
 * Utility functions for normalizing and comparing hardware device IDs across
 * different formats (e.g. 'feeder-esp32-001', 'feeder_esp32_01', 'claim_feeder_esp32_01').
 */

export function normalizeDeviceId(id?: string | null): string {
  if (!id) return '';
  return id
    .trim()
    .replace(/^claim_/, '')
    .replace(/-/g, '_')
    .replace(/_001$/, '_01')
    .toLowerCase();
}

export function isSameDeviceId(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return normalizeDeviceId(a) === normalizeDeviceId(b);
}

export function toHardwareDeviceId(id?: string | null, claimToken?: string | null): string {
  const raw = claimToken ? claimToken.replace(/^claim_/, '') : id || 'feeder_esp32_01';
  const normalized = normalizeDeviceId(raw);
  return normalized || 'feeder_esp32_01';
}
