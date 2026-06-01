export function isLocalAuthBypassEnabled(): boolean {
  return ['1', 'true', 'yes', 'on'].includes(
    (process.env.LOCAL_AUTH_BYPASS ?? '').trim().toLowerCase()
  );
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (isLocalAuthBypassEnabled()) {
    return true;
  }

  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}
