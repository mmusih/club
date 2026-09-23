import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
const state = globalThis as typeof globalThis & { clubPool?: Pool };
export function getPool() {
  if (!state.clubPool) {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) throw new Error('MySQL connection settings are missing.');
    state.clubPool = mysql.createPool({
      host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, connectionLimit: 5, charset: 'utf8mb4', flags: ['-FOUND_ROWS'],
      ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
    });
  }
  return state.clubPool;
}
// Retain the parameterised query interface while switching to MySQL.
export function database() {
  return { prepare(sql: string) {
    const statement = (values: (string | number | Buffer)[] = []) => ({
      bind: (...bound: (string | number | Buffer)[]) => statement(bound),
      async first<T>() {
        const [rows] = await getPool().execute<RowDataPacket[]>(sql, values);
        return (rows[0] as T | undefined) ?? null;
      },
      async all<T>() {
        const [rows] = await getPool().execute<RowDataPacket[]>(sql, values);
        return { results: rows as T[] };
      },
      async run() {
        const [result] = await getPool().execute<ResultSetHeader>(sql, values);
        return { meta: { changes: result.affectedRows } };
      },
    });
    return statement();
  } };
}
