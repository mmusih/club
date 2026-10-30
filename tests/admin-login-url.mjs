import assert from 'node:assert/strict';
import { canonicalLoginUrl } from '../lib/admin-login-url.ts';

const app = 'https://eyesontheball.co.bw';
assert.equal(canonicalLoginUrl(app + '/admin/login', app), null);
assert.equal(canonicalLoginUrl(app + '/admin/login', app + '/'), null);
for (const origin of ['https://www.eyesontheball.co.bw', 'https://preview.hostingersite.com', 'http://eyesontheball.co.bw']) {
  assert.equal(canonicalLoginUrl(origin + '/admin/login?return_to=%2Fadmin%2Fplayers&error=invalid', app),
    app + '/admin/login?return_to=%2Fadmin%2Fplayers&error=invalid');
}
assert.equal(canonicalLoginUrl('http://localhost:5173/admin/login', undefined), null);
assert.equal(canonicalLoginUrl('https://other.example/admin/login?return_to=https://evil.example', app),
  app + '/admin/login?return_to=https://evil.example', 'Query parameters cannot change the destination host');
console.log('PASS: canonical login, www/preview/HTTP redirects, query preservation and local development.');
