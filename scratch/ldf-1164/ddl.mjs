// LDF-1164 probe: cost of a data session's DDL and seeding on a one-node replica set.
import { createRequire } from 'node:module';
const require = createRequire('/Users/puffin/.puffin/work/51839/lowdefy-ldf1164/packages/utils/test-utils/package.json');
const { MongoMemoryReplSet } = require('mongodb-memory-server-core');
const { MongoClient } = require('mongodb');
const extra = process.argv.slice(2);
const rs = await MongoMemoryReplSet.create({ instanceOpts: [{ args: ['--wiredTigerCacheSizeGB', '0.25', ...extra] }], replSet: { count: 1, storageEngine: 'wiredTiger' } });
const client = await new MongoClient(rs.getUri()).connect();
const t = async (label, fn, n = 10) => { const s = performance.now(); for (let i = 0; i < n; i++) await fn(i); console.log(label, ((performance.now() - s) / n).toFixed(1), 'ms'); };
const docs = Array.from({ length: 45 }, (_, i) => ({ _id: `d${i}`, name: `doc ${i}`, n: i }));
await t('12 createCollection in parallel', (i) => Promise.all(Array.from({ length: 12 }, (_, c) => client.db(`p_${i}`).createCollection(`c${c}`))));
await t('12 createCollection serial', async (i) => { for (let c = 0; c < 12; c++) await client.db(`s_${i}`).createCollection(`c${c}`); });
await t('45 replaceOne upserts serial', (i) => (async () => { const col = client.db(`p_${i}`).collection('c0'); for (const d of docs) await col.replaceOne({ _id: d._id }, d, { upsert: true }); })());
await t('1 bulkWrite of 45 upserts', (i) => client.db(`p_${i}`).collection('c1').bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }))));
await t('45 upserts into implicit collections (no createCollection)', (i) => client.db(`q_${i}`).collection('x').bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }))));
await t('dropDatabase', (i) => client.db(`p_${i}`).dropDatabase());
await t('deleteMany on 12 collections (reuse instead of drop)', (i) => Promise.all(Array.from({ length: 12 }, (_, c) => client.db(`s_${i}`).collection(`c${c}`).deleteMany({}))));
await client.close(); await rs.stop();
