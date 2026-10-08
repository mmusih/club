import fs from 'node:fs';

const bundle = JSON.parse(fs.readFileSync('outputs/delivery-content.json', 'utf8'));
const demo = JSON.parse(bundle.site_content[0].body);
const json = value => `JSON_EXTRACT(CONVERT(X'${Buffer.from(JSON.stringify(value)).toString('hex')}' USING utf8mb4), '$')`;
const lines = [
  '-- Add demo content to existing site_content row 1. No tables are created or deleted.',
  '-- Existing entries, contacts, photos, real players and credentials are preserved.',
  '-- Export a database backup before importing. Re-importing does not duplicate examples.',
  'SET NAMES utf8mb4;',
  'START TRANSACTION;',
  'SET @demo_body = NULL;',
  'SELECT body INTO @demo_body FROM site_content WHERE id = 1 FOR UPDATE;',
];
for (const key of ['demoPlayerIds', 'news', 'fixtures', 'staff', 'standings', 'honours']) {
  lines.push(`SET @demo_body = IF(JSON_TYPE(JSON_EXTRACT(@demo_body, '$.${key}')) = 'ARRAY', @demo_body, JSON_SET(@demo_body, '$.${key}', JSON_ARRAY()));`);
  const entries = key === 'demoPlayerIds' ? demo[key] : demo[key].filter(item => item.id.startsWith('demo-'));
  for (const entry of entries) {
    const id = key === 'demoPlayerIds' ? entry : entry.id;
    const path = key === 'demoPlayerIds' ? '$.demoPlayerIds[*]' : `$.${key}[*].id`;
    lines.push(`SET @demo_body = IF(JSON_SEARCH(@demo_body, 'one', '${id}', NULL, '${path}') IS NULL, JSON_ARRAY_APPEND(@demo_body, '$.${key}', ${json(entry)}), @demo_body);`);
  }
}
lines.push("SET @demo_body = IF(JSON_TYPE(JSON_EXTRACT(@demo_body, '$.sections')) = 'OBJECT', @demo_body, JSON_SET(@demo_body, '$.sections', JSON_OBJECT()));");
for (const section of ['news', 'fixtures', 'squad', 'staff', 'standings', 'honours']) {
  lines.push(`SET @demo_body = JSON_SET(@demo_body, '$.sections.${section}', JSON_EXTRACT('true', '$'));`);
}
lines.push(
  "UPDATE site_content SET body = @demo_body, version = version + 1, updated_at = DATE_FORMAT(UTC_TIMESTAMP(3), '%Y-%m-%dT%H:%i:%s.%fZ') WHERE id = 1 AND @demo_body IS NOT NULL AND BINARY body <> BINARY @demo_body;",
  'COMMIT;',
  "SELECT id, JSON_LENGTH(JSON_EXTRACT(body, '$.demoPlayerIds')) AS demo_players FROM site_content WHERE id = 1;",
);
fs.writeFileSync('outputs/hostinger-demo-update.sql', lines.join('\n') + '\n');
console.log('Created outputs/hostinger-demo-update.sql');
