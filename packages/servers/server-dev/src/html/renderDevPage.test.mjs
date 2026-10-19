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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { default: renderDevPage } = await import('./renderDevPage.js');
const { JOURNEY_COOKIES, writeJourneyCookie } = await import('../../lib/server/journeyCookies.js');

function render({ cookie } = {}) {
  let html;
  const c = {
    get: () => undefined,
    req: { header: (name) => (name === 'cookie' ? cookie : undefined) },
    html: (value) => {
      html = value;
      return value;
    },
  };
  renderDevPage(c, { basePath: '' });
  const match = /<script id="__LOWDEFY_CONFIG__" type="application\/json">(.*?)<\/script>/.exec(
    html
  );
  return JSON.parse(match[1]);
}

afterEach(() => {
  delete process.env.LOWDEFY_DEV_RECORD;
});

test('renderDevPage enables recording in a developer tab by default', () => {
  expect(render().recording).toEqual({ enabled: true });
});

test('renderDevPage disables recording for a context whose recording cookie is off', () => {
  const written = writeJourneyCookie({
    name: JOURNEY_COOKIES.recording.name,
    payload: 'off',
    origin: 'http://localhost:3001',
  });
  expect(render({ cookie: `${written.name}=${written.value}` }).recording).toEqual({
    enabled: false,
  });
});

test('renderDevPage disables recording when LOWDEFY_DEV_RECORD is false', () => {
  process.env.LOWDEFY_DEV_RECORD = 'false';
  expect(render().recording).toEqual({ enabled: false });
});

function renderWithHeaders() {
  const headers = {};
  let html;
  const c = {
    get: () => undefined,
    header: (name, value) => {
      headers[name] = value;
    },
    req: { header: () => undefined, url: 'http://localhost:3122/home' },
    html: (value) => {
      html = value;
      return value;
    },
  };
  renderDevPage(c, { basePath: '' });
  return { headers, html };
}

describe('renderDevPage with a Content-Security-Policy', () => {
  const originalCwd = process.cwd();
  let serverDirectory;

  beforeAll(() => {
    serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-csp-'));
    fs.mkdirSync(path.join(serverDirectory, 'build'));
    process.chdir(serverDirectory);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(serverDirectory, { recursive: true, force: true });
  });

  function writeSecurity(security) {
    fs.writeFileSync(path.join(serverDirectory, 'build/security.json'), JSON.stringify(security));
  }

  test('renderDevPage sends no header and writes no nonce when the policy is off', () => {
    writeSecurity({ contentSecurityPolicy: null });
    const { headers, html } = renderWithHeaders();
    expect(headers).toEqual({});
    expect(html).not.toContain(' nonce="');
  });

  test('renderDevPage puts the header nonce on every script and allows the hot reload socket', () => {
    writeSecurity({
      contentSecurityPolicy: {
        reportOnly: false,
        directives: {
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'connect-src': ["'self'"],
          '~k': '12',
        },
        nonceDirectives: ['script-src', 'style-src'],
        websockets: false,
        '~k': '11',
      },
      '~k': '10',
    });
    const first = renderWithHeaders();
    const second = renderWithHeaders();
    const header = first.headers['Content-Security-Policy'];
    const nonce = header.match(/'nonce-([^']+)'/)[1];
    expect(header).toEqual(
      `script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; connect-src 'self' ws://localhost:3122 wss://localhost:3122`
    );
    const scripts = first.html.match(/<script\b[^>]*>/g);
    expect(scripts.length).toEqual(5);
    scripts.forEach((tag) => expect(tag).toContain(` nonce="${nonce}"`));
    expect(first.html).toContain(`<meta property="csp-nonce" nonce="${nonce}" />`);
    expect(second.headers['Content-Security-Policy']).not.toEqual(header);
  });
});
