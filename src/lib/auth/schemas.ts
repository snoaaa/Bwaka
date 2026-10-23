import { z } from 'zod';

export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s().-]/g, '');
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) return cleaned;
  if (/^00[1-9]\d{6,14}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
  if (/^[26]\d{8}$/.test(cleaned)) return `+237${cleaned}`;
  return null;
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Please enter your email address.')
  .max(254, 'This email address is too long.')
  .pipe(z.email('Please enter a valid email address.'));

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your full name.')
  .max(80, 'Your name must be 80 characters or fewer.')
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u,
    'Your name can only contain letters, spaces and - . \''
  );

export const phoneSchema = z
  .string()
  .trim()
  .min(6, 'Please enter a valid mobile number.')
  .refine((value) => normalizePhone(value) !== null, {
    message: 'Enter a valid mobile phone number.',
  });

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit code.'),
});

export const emailLoginSchema = z.object({ email: emailSchema });
export const phoneLoginSchema = z.object({ phone: phoneSchema });

export const emailSignUpSchema = z.object({ fullName: fullNameSchema, email: emailSchema });
export const phoneSignUpSchema = z.object({ fullName: fullNameSchema, phone: phoneSchema });

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type Validation<S extends z.ZodType> =
  | { success: true; data: z.output<S> }
  | { success: false; errors: FieldErrors<z.input<S>> };

export function validate<S extends z.ZodType>(schema: S, input: unknown): Validation<S> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return { success: false, errors: errors as FieldErrors<z.input<S>> };
}
