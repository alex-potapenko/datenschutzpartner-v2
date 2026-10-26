/** Preserves the member email when switching between login and forgot-password. */
export function loginForgotPasswordHref(email?: string | null, returnTo?: string | null): string {
  const params = new URLSearchParams();
  const normalized = email?.trim().toLowerCase();
  if (normalized) params.set('email', normalized);
  if (returnTo?.trim()) params.set('returnTo', returnTo.trim());
  const query = params.toString();
  return query ? `/login/forgot-password?${query}` : '/login/forgot-password';
}

export function loginHrefWithPreservedEmail(
  email?: string | null,
  returnTo?: string | null
): string {
  const params = new URLSearchParams();
  const normalized = email?.trim().toLowerCase();
  if (normalized) params.set('email', normalized);
  if (returnTo?.trim()) params.set('returnTo', returnTo.trim());
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
}
