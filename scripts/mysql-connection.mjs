import mysql from 'mysql2/promise';
export async function connect() {
  for (const key of ['DB_HOST','DB_USER','DB_NAME']) if (!process.env[key]) throw new Error(key + ' is required.');
  return mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,charset:'utf8mb4',...(process.env.DB_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
}
