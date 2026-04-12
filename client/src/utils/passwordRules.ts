/** Shared password validation rules used across auth forms */

export interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',  test: pw => pw.length >= 8 },
  { label: 'One uppercase letter',   test: pw => /[A-Z]/.test(pw) },
  { label: 'One number',             test: pw => /[0-9]/.test(pw) },
  { label: 'One special character',  test: pw => /[^A-Za-z0-9]/.test(pw) },
];

export function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return `Password must include: ${rule.label.toLowerCase()}.`;
    }
  }
  return null;
}
