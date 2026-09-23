import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export async function hashPassword(password) {
  if (password.length < 14 || password.length > 256) throw new Error('Use a password between 14 and 256 characters.');
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return ['scrypt', salt, key.toString('hex')].join(':');
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 256 || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded || '')) return false;
  const [, salt, hash] = encoded.split(':');
  const actual = await derive(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
