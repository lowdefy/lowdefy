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

import { Hono } from 'hono';
import { vi, afterEach, expect, test } from 'vitest';

const { default: getPageConfig } = await import('@lowdefy/api/routes/page/getPageConfig.js');
const { default: createContentSecurityPolicy } = await import(
  '@lowdefy/api/csp/createContentSecurityPolicy.js'
);
const { default: addNonceToElements } = await import('@lowdefy/api/csp/addNonceToElements.js');

const security = { contentSecurityPolicy: null };

vi.doMock('@lowdefy/api', () => ({
  addNonceToElements,
  createContentSecurityPolicy,
  getPageConfig,
  getRootConfig: async () => ({ home: { configured: true, pageId: 'home', pathParams: {} } }),
}));
vi.doMock('../../lib/build/app.js', () => ({
  default: {
    html: {
      appendHead: '<script src="https://cdn.example.com/a.js"></script>',
      appendBody: '<script>window.b = 1;</script>',
    },
  },
}));
vi.doMock('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login' } },
}));
vi.doMock('../../lib/build/config.js', () => ({ default: { basePath: '' } }));
vi.doMock('../../lib/build/security.js', () => ({ default: security }));
vi.doMock('../../lib/build/theme.js', () => ({ default: {} }));
vi.doMock('./getAssets.js', () => ({
  default: () => ({ js: 'assets/main.js', css: [], imports: [] }),
}));
vi.doMock('./getPageAssets.js', () => ({
  default: () => ({ js: [], css: [], prefetch: [] }),
}));

const { default: renderPage } = await import('./renderPage.js');
// The mobile sign-in route reaches the auth engine, which these tests never start.
vi.doMock('../routes/mobileSignIn.js', () => ({ default: () => null }));
vi.doMock('../routes/mobileSignInCallback.js', () => ({ default: () => null }));
const { default: mountPageRoutes } = await import('../routes/mountPageRoutes.js');

const policy = {
  reportOnly: false,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'connect-src': ["'self'"],
  },
  nonceDirectives: ['script-src', 'style-src'],
  websockets: true,
};

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      authEnforcement: { pagesProtectedByDefault: false },
      authorizeOutcome: () => 'allow',
      logger: { info: vi.fn() },
      readConfigFile: async (file) => {
        if (file === 'routes.json') return [{ pageId: 'home', path: 'home' }];
        if (file === 'pages/home.json') return { id: 'home' };
        return null;
      },
      user: null,
    });
    await next();
  });
  mountPageRoutes({ app, basePath: '', renderPage });
  return app;
}

function getHeaderNonce(header) {
  return header.match(/'nonce-([^']+)'/)[1];
}

afterEach(() => {
  security.contentSecurityPolicy = null;
});

test('renderPage sends no Content-Security-Policy and writes no nonce when the policy is off', async () => {
  const res = await createApp().request('https://app.example.com/home');
  expect(res.headers.get('content-security-policy')).toBeNull();
  expect(res.headers.get('content-security-policy-report-only')).toBeNull();
  expect(await res.text()).not.toContain(' nonce="');
});

test('renderPage puts the header nonce on every script element of the page', async () => {
  security.contentSecurityPolicy = policy;
  const res = await createApp().request('https://app.example.com/home');
  const header = res.headers.get('content-security-policy');
  const nonce = getHeaderNonce(header);
  expect(header).toEqual(
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; connect-src 'self' wss://app.example.com`
  );
  const scripts = (await res.text()).match(/<script\b[^>]*>/g);
  expect(scripts.length).toEqual(6);
  scripts.forEach((tag) => expect(tag).toContain(` nonce="${nonce}"`));
});

test('renderPage draws a different nonce for each render', async () => {
  security.contentSecurityPolicy = policy;
  const app = createApp();
  const first = await app.request('https://app.example.com/home');
  const second = await app.request('https://app.example.com/home');
  const firstNonce = getHeaderNonce(first.headers.get('content-security-policy'));
  const secondNonce = getHeaderNonce(second.headers.get('content-security-policy'));
  expect(firstNonce).not.toEqual(secondNonce);
  expect(await second.text()).toContain(`nonce="${secondNonce}"`);
});

test('renderPage sends the report-only header when the policy is report only', async () => {
  security.contentSecurityPolicy = { ...policy, reportOnly: true };
  const res = await createApp().request('https://app.example.com/home');
  expect(res.headers.get('content-security-policy')).toBeNull();
  expect(res.headers.get('content-security-policy-report-only')).toContain("default-src 'self'");
});
