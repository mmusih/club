/** Keep login submission, the host-only session cookie, and redirects on one origin. */
export function canonicalLoginUrl(currentUrl: string, appUrl?: string) {
  if (!appUrl) return null;
  const current = new URL(currentUrl);
  const canonical = new URL(appUrl);
  if (current.origin === canonical.origin) return null;
  const destination = new URL('/admin/login', canonical.origin);
  destination.search = current.search;
  return destination.href;
}
