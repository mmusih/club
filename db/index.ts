import { drizzle } from 'drizzle-orm/mysql2';
import { getPool } from './mysql';
import * as schema from './schema';
export function getDb() { return drizzle(getPool(), { schema, mode: 'default' }); }
