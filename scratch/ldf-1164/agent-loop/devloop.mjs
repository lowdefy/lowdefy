// LDF-1164 scratch: time the agent's dev-server loop on Pelican.
// usage: node devloop.mjs <label> <port> [--no-start]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const L = '/Users/puffin/.puffin/work/31792/lowdefy';
const APP = '/Users/puffin/.puffin/work/31792/pelican/apps/pelican';
const SDK = `${L}/packages/cli/node_modules/@modelcontextprotocol/sdk/dist/esm`;
const { Client } = await import(`${SDK}/client/index.js`);
const { StreamableHTTPClientTransport } = await import(`${SDK}/client/streamableHttp.js`);
const { readDevInstance } = await import(`${L}/packages/utils/node-utils/dist/index.js`);

const [label, port, ...flags] = process.argv.slice(2);
const OUT = `/tmp/ldf1164b/dev-${label}`;
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const T0 = performance.now();
const now = () => Math.round(performance.now() - T0);
function note(name, ms, extra = {}) {
  const row = { name, ms, at: now(), ...extra };
  results.push(row);
  console.log(JSON.stringify(row));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let child;
if (!flags.includes('--no-start')) {
  const log = fs.createWriteStream(`${OUT}/server.log`);
  child = spawn(
    'infisical',
    [
      'run', '--projectId', 'dde10071-c3c2-4016-b6d2-b7218fa71511', '--env=local',
      '--path=/apps/pelican', '--silent', '--',
      'node', `${L}/scripts/dev.mjs`, '--skip-build', '--no-open', '--port', port,
      '--config-directory', APP, '--dev-directory', `${APP}/.lowdefy/dev`,
    ],
    { cwd: L, env: { ...process.env, pnpm_config_verify_deps_before_run: 'false' }, detached: true }
  );
  const stamp = (d) => {
    for (const line of d.toString().split('\n')) if (line) log.write(`${now()} ${line}\n`);
  };
  child.stdout.on('data', stamp);
  child.stderr.on('data', stamp);
  // ready = instance.json says ready
  const t = performance.now();
  for (;;) {
    const inst = readDevInstance({ configDirectory: APP });
    if (inst?.state === 'ready' && inst.url) break;
    if (performance.now() - t > 480000) throw new Error('not ready');
    await sleep(200);
  }
  note('start_to_ready', Math.round(performance.now() - t));
}
const inst = readDevInstance({ configDirectory: APP });
const client = new Client({ name: 'ldf1164', version: '0' });
await client.connect(new StreamableHTTPClientTransport(new URL(`${inst.url}/lowdefy-docs/mcp`)));

async function call(name, args, tag) {
  const t = performance.now();
  const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 600000 });
  const ms = Math.round(performance.now() - t);
  const text = r.content?.map((c) => c.text ?? '').join('\n') ?? '';
  fs.writeFileSync(`${OUT}/${tag}.txt`, text);
  let summary;
  try {
    const j = JSON.parse(text);
    summary = {
      status: j.build?.status ?? j.ok,
      settled: j.settled,
      checked: j.pages?.checked,
      errors: (j.errors ?? j.build?.errors ?? []).length,
    };
  } catch {
    summary = { head: text.slice(0, 120) };
  }
  note(tag, ms, summary);
  return text;
}
async function http(tag, url) {
  const t = performance.now();
  const res = await fetch(url);
  const body = await res.text();
  note(tag, Math.round(performance.now() - t), { status: res.status, bytes: body.length });
}

function edit(file, from, to) {
  const p = path.join(APP, file);
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error(`${from} not in ${file}`);
  fs.writeFileSync(p, s.replace(from, to));
}

const SMALL = ['pages/content/inspiration/inspiration.yaml', '    title: Inspiration\n', 'content-inspiration'];
const LARGE = ['pages/contacts/contact/contact.yaml', '        - Contact\n', 'contact'];

if (!flags.includes('--no-start')) {
  await http('first_html_root', `${inst.url}/`);
  await call('lowdefy_build_status', { wait: true }, 'status_after_start');
}
if (flags.includes('--api')) {
  await call('lowdefy_get_page_config', { pageId: 'contact' }, 'api_page_first_contact');
  const API = ['api/contacts/contacts-references.yaml', 'enum: [contact, company]', 'enum: [contact, company, x'];
  for (const round of [1, 2]) {
    const to = `${API[2]}${round}]`;
    edit(API[0], API[1], to);
    await call('lowdefy_build_status', { wait: true }, `api_edit${round}`);
    await call('lowdefy_get_page_config', { pageId: 'contact' }, `api_edit${round}_page_contact`);
    edit(API[0], to, API[1]);
    await call('lowdefy_build_status', { wait: true }, `api_revert${round}`);
    await call('lowdefy_get_page_config', { pageId: 'contact' }, `api_revert${round}_page_contact`);
  }
}
if (!flags.includes('--only-check') && !flags.includes('--api')) for (const [file, from, pageId] of [SMALL, LARGE]) {
  await call('lowdefy_get_page_config', { pageId }, `page_first_${pageId}`);
  await call('lowdefy_get_page_config', { pageId }, `page_again_${pageId}`);
  for (const round of [1, 2]) {
    const to = from.replace('\n', ` ${label}${round}\n`);
    edit(file, from, to);
    await call('lowdefy_build_status', { wait: true }, `edit${round}_${pageId}`);
    edit(file, to, from);
    await call('lowdefy_build_status', { wait: true }, `revert${round}_${pageId}`);
  }
}
// an edit to a file many pages share
if (!flags.includes('--only-check') && !flags.includes('--api')) {
  const file = 'pages/shared/breadcrumbs.yaml';
  const s = fs.readFileSync(path.join(APP, file), 'utf8');
  fs.writeFileSync(path.join(APP, file), `${s}\n# ldf1164 ${label}\n`);
  await call('lowdefy_build_status', { wait: true }, 'edit_shared_comment');
  fs.writeFileSync(path.join(APP, file), s);
  await call('lowdefy_build_status', { wait: true }, 'revert_shared_comment');
}
if (!flags.includes('--skip-check')) {
  await call('lowdefy_check', {}, 'check1');
  await call('lowdefy_check', {}, 'check2');
}

fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
await client.close();
if (child && !flags.includes('--keep')) {
  process.kill(-child.pid, 'SIGTERM');
  await sleep(3000);
}
process.exit(0);
