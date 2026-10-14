import { z } from 'zod';

export const ScheduleFormSchema = z.object({
  timeLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format (e.g. 08:30)'),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day of the week'),
  durationMs: z.number().min(300).max(5000),
  label: z.string().max(40).optional(),
  enabled: z.boolean().default(true),
});

export type ScheduleFormData = z.infer<typeof ScheduleFormSchema>;

export const PresetDurationSchema = z.object({
  snackMs: z.number().min(300).max(5000),
  bowlMs: z.number().min(300).max(5000),
  feastMs: z.number().min(300).max(5000),
});
