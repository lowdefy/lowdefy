#!/usr/bin/env node
/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*
  The external services of the enrichment reference app, mocked for the e2e run: never a
  real service. One HTTP server, deterministic answers, fictional companies.

    GET  /company/companies?domain=       company lookup (the company_lookup provider)
    GET  /email-a/find?name=&domain=      first email source (the email_finder waterfall)
    GET  /email-b/v2/search?name=&domain= second email source, another response shape
    POST /anthropic/v1/messages           the Anthropic Messages API (the ai provider)

  Test controls:

    GET  /__health    200 when listening
    GET  /__log       every call made to the services above, in order
    POST /__reset     clears the log and the per-domain counters, restores the default config
    POST /__config    { latencyMs: { company, email_a, email_b, ai } } per service latency

  The company lookup answers 404 for nowhere.test (a provider "no result"), 500 for
  broken.test (retried, then an error), 400 for badrequest.test (a final error) and 429
  on the first call for busybee.test (rate limited, then answers).

  Usage: node mockServices.mjs --port 3198
*/

import http from 'node:http';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { port: { type: 'string' } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`mockServices requires --port. Received ${JSON.stringify(values.port)}.`);
}

const companies = {
  'brightpath.test': {
    name: 'Brightpath Freight',
    industry: 'Logistics',
    employees: 420,
    country: 'NL',
    founded: 2004,
  },
  'quillsoft.test': {
    name: 'Quillsoft',
    industry: 'Software',
    employees: 1200,
    country: 'US',
    founded: 2011,
  },
  'tidewater.test': {
    name: 'Tidewater Goods',
    industry: 'Retail',
    employees: 85,
    country: 'ZA',
    founded: 1999,
  },
  'ferncrest.test': {
    name: 'Ferncrest Labs',
    industry: 'Software',
    employees: 38,
    country: 'DE',
    founded: 2019,
  },
  'busybee.test': {
    name: 'Busy Bee Bakery',
    industry: 'Retail',
    employees: 12,
    country: 'GB',
    founded: 2015,
  },
};

// Source A knows some domains and answers 404 for the rest; source B knows others and
// answers 200 with `result: null` for the rest, so the waterfall handles both kinds of miss.
const emailSourceA = new Set(['brightpath.test', 'ferncrest.test']);
const emailSourceB = new Set(['quillsoft.test', 'tidewater.test', 'busybee.test']);

const defaultConfig = { latencyMs: { company: 0, email_a: 0, email_b: 0, ai: 0 } };

let config = structuredClone(defaultConfig);
let log = [];
let counts = new Map();

function countCall(key) {
  const count = (counts.get(key) ?? 0) + 1;
  counts.set(key, count);
  return count;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emailFor({ name, domain }) {
  const local = String(name ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join('.');
  return `${local}@${domain}`;
}

function companyLookup({ query }) {
  const domain = query.get('domain');
  if (domain === 'nowhere.test') return { status: 404, body: { error: 'Company not found.' } };
  if (domain === 'broken.test') return { status: 500, body: { error: 'Upstream failure.' } };
  if (domain === 'badrequest.test') return { status: 400, body: { error: 'Unsupported domain.' } };
  if (domain === 'busybee.test' && countCall(`company:${domain}`) === 1) {
    return { status: 429, body: { error: 'Rate limited.' }, headers: { 'retry-after': '1' } };
  }
  const company = companies[domain];
  if (company === undefined) return { status: 404, body: { error: 'Company not found.' } };
  return { status: 200, body: { domain, ...company } };
}

function emailA({ query }) {
  const domain = query.get('domain');
  if (!emailSourceA.has(domain)) return { status: 404, body: { error: 'No match.' } };
  return {
    status: 200,
    body: { email: emailFor({ name: query.get('name'), domain }), confidence: 0.92 },
  };
}

function emailB({ query }) {
  const domain = query.get('domain');
  if (!emailSourceB.has(domain)) return { status: 200, body: { result: null } };
  return {
    status: 200,
    body: { result: { address: emailFor({ name: query.get('name'), domain }), score: 71 } },
  };
}

function promptText(body) {
  return (body.messages ?? [])
    .flatMap((message) =>
      typeof message.content === 'string'
        ? [message.content]
        : (message.content ?? []).map((part) => part.text ?? '')
    )
    .join('\n');
}

// The JSON schema the AI SDK asks for: `output_config.format` for models with structured
// outputs, or a forced `json` tool for the others.
function requestedSchema(body) {
  const format = body.output_config?.format;
  if (format?.schema) return { schema: format.schema, mode: 'text' };
  const tool = (body.tools ?? []).find((item) => item.name === 'json');
  if (tool) return { schema: tool.input_schema, mode: 'tool' };
  return { schema: null, mode: 'text' };
}

// Deterministic answers, typed by the schema of `value`:
//   enum:    the first option the prompt names, else the first option
//   number:  the first integer in the prompt, else the prompt length
//   boolean: whether the prompt mentions software
//   string:  a reply that quotes the prompt
function answer({ prompt, valueSchema }) {
  if (Array.isArray(valueSchema?.enum)) {
    const named = valueSchema.enum.find((option) =>
      prompt.toLowerCase().includes(String(option).toLowerCase())
    );
    return named ?? valueSchema.enum[0];
  }
  if (valueSchema?.type === 'number' || valueSchema?.type === 'integer') {
    const match = /\d+/.exec(prompt);
    return match === null ? prompt.length : Number(match[0]);
  }
  if (valueSchema?.type === 'boolean') {
    return /software/i.test(prompt);
  }
  return `Mock reply to: ${prompt}`;
}

function anthropicMessages({ body }) {
  const prompt = promptText(body);
  const { schema, mode } = requestedSchema(body);
  const text = schema === null ? answer({ prompt, valueSchema: { type: 'string' } }) : null;
  const object =
    schema === null ? null : { value: answer({ prompt, valueSchema: schema.properties?.value }) };
  let content;
  if (mode === 'tool') {
    content = [{ type: 'tool_use', id: 'toolu_mock', name: 'json', input: object }];
  } else {
    content = [{ type: 'text', text: object === null ? text : JSON.stringify(object) }];
  }
  return {
    status: 200,
    body: {
      id: `msg_mock_${log.length}`,
      type: 'message',
      role: 'assistant',
      model: body.model,
      content,
      stop_reason: mode === 'tool' ? 'tool_use' : 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: prompt.length, output_tokens: 8 },
    },
  };
}

const services = [
  { service: 'company', method: 'GET', path: '/company/companies', handle: companyLookup },
  { service: 'email_a', method: 'GET', path: '/email-a/find', handle: emailA },
  { service: 'email_b', method: 'GET', path: '/email-b/v2/search', handle: emailB },
  { service: 'ai', method: 'POST', path: '/anthropic/v1/messages', handle: anthropicMessages },
];

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text === '' ? {} : JSON.parse(text);
}

async function handleControl({ req, res, url }) {
  if (url.pathname === '/__health') return send(res, 200, { ok: true });
  if (url.pathname === '/__log') return send(res, 200, log);
  if (url.pathname === '/__reset' && req.method === 'POST') {
    config = structuredClone(defaultConfig);
    log = [];
    counts = new Map();
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/__config' && req.method === 'POST') {
    const body = await readBody(req);
    config = { latencyMs: { ...config.latencyMs, ...(body.latencyMs ?? {}) } };
    return send(res, 200, config);
  }
  return send(res, 404, { error: `Unknown control ${url.pathname}.` });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/__')) {
      await handleControl({ req, res, url });
      return;
    }
    const route = services.find((item) => item.method === req.method && item.path === url.pathname);
    if (route === undefined) {
      send(res, 404, { error: `No mock for ${req.method} ${url.pathname}.` });
      return;
    }
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    const entry = {
      service: route.service,
      query: Object.fromEntries(url.searchParams),
      at: Date.now(),
    };
    if (route.service === 'ai') {
      entry.prompt = promptText(body);
      entry.system = body.system;
      entry.model = body.model;
    }
    log.push(entry);
    await wait(config.latencyMs[route.service] ?? 0);
    const result = route.handle({ query: url.searchParams, body });
    entry.status = result.status;
    send(res, result.status, result.body, result.headers);
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Enrichment mock services listening on http://127.0.0.1:${port}`);
});

function stop() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
