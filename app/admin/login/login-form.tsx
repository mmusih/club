'use client';

import { useEffect, type ReactNode } from 'react';
import { canonicalLoginUrl } from '../../../lib/admin-login-url';

export function LoginForm({ appUrl, children }: { appUrl?: string; children: ReactNode }) {
  useEffect(() => {
    const destination = canonicalLoginUrl(window.location.href, appUrl);
    if (destination) window.location.replace(destination);
  }, [appUrl]);

  return <form action="/api/auth/login" method="post" style={{ display: 'grid', gap: 16 }} onSubmit={event => {
    // Also guard submissions made before the redirect effect has run.
    const destination = canonicalLoginUrl(window.location.href, appUrl);
    if (destination) {
      event.preventDefault();
      window.location.replace(destination);
    }
  }}>{children}</form>;
}
