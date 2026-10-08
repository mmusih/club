import fs from 'node:fs';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';

process.loadEnvFile('.env.hostinger-test');
assert.ok(['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST));
assert.match(process.env.DB_NAME, /^club_hostinger_test/);
const db = await mysql.createConnection({host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME, multipleStatements:true});
try {
  // Session-local temporary table shadows the real table; no persistent content is changed.
  await db.query('CREATE TEMPORARY TABLE site_content (id INT PRIMARY KEY, body LONGTEXT, version INT, updated_at VARCHAR(32))');
  const original = {email:'keep@example.invalid', hero:'/keep.jpg', photos:[{id:'keep-photo'}], news:[{id:'real-news', title:'Keep this'}, {id:'demo-news-1', title:'Edited example'}], sections:{join:false}};
  await db.execute('INSERT INTO site_content VALUES (1, ?, 7, ?)', [JSON.stringify(original), new Date().toISOString()]);
  const sql = fs.readFileSync('outputs/hostinger-demo-update.sql', 'utf8');
  await db.query(sql);
  const [[first]] = await db.query('SELECT * FROM site_content WHERE id=1');
  const body = JSON.parse(first.body);
  assert.equal(body.demoPlayerIds.length, 5);
  assert.equal(body.news.length, 4);
  assert.equal(body.news.find(n=>n.id==='demo-news-1').title, 'Edited example');
  assert.equal(body.email, original.email);
  assert.equal(body.hero, original.hero);
  assert.deepEqual(body.photos, original.photos);
  assert.equal(body.sections.join, false);
  assert.equal(body.sections.squad, true);
  for (const [key,count] of Object.entries({fixtures:6,staff:3,standings:4,honours:2})) assert.equal(body[key].length,count);
  await db.query(sql);
  const [[second]] = await db.query('SELECT * FROM site_content WHERE id=1');
  assert.equal(second.body, first.body);
  assert.equal(second.version, first.version);
  console.log('PASS: demo import preserves existing content and is repeatable without duplicates.');
} finally { await db.end(); }
