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

import redirectToChallenge from './redirectToChallenge.js';

// ctx.redirect returns an APIError carrying the location header; the caller
// throws it and runAfterHooks turns it into the response. The fake returns a
// plain marker object so the thrown value can be read back in the test.
function createCtx({ location } = {}) {
  const responseHeaders = new Headers();
  if (location !== undefined) {
    responseHeaders.set('location', location);
  }
  return {
    context: { responseHeaders },
    redirect: (url) => ({ redirectTo: url }),
  };
}

function catchRedirect(fn) {
  try {
    fn();
  } catch (thrown) {
    return thrown.redirectTo;
  }
  throw new Error('redirectToChallenge did not throw a redirect.');
}

test('redirectToChallenge carries a same-origin pending destination as callbackUrl', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: 'https://app.example.com',
      ctx: createCtx({ location: 'https://app.example.com/app/invoices/123' }),
      twoFactorPageUrl: 'https://app.example.com/app/two-factor',
    })
  );
  const url = new URL(location);
  expect(url.origin + url.pathname).toBe('https://app.example.com/app/two-factor');
  expect(url.searchParams.get('callbackUrl')).toBe('/app/invoices/123');
});

test('redirectToChallenge drops an off-origin pending destination - an open redirect off the public challenge page', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: 'https://app.example.com',
      ctx: createCtx({ location: 'https://evil.com/x' }),
      twoFactorPageUrl: 'https://app.example.com/two-factor',
    })
  );
  expect(new URL(location).searchParams.has('callbackUrl')).toBe(false);
  expect(location).toBe('https://app.example.com/two-factor');
});

test('redirectToChallenge drops a protocol-relative pending destination', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: 'https://app.example.com',
      ctx: createCtx({ location: '//evil.com/x' }),
      twoFactorPageUrl: 'https://app.example.com/two-factor',
    })
  );
  expect(new URL(location).searchParams.has('callbackUrl')).toBe(false);
});

test('redirectToChallenge still redirects when there is no pending destination', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: 'https://app.example.com',
      ctx: createCtx(),
      twoFactorPageUrl: 'https://app.example.com/two-factor',
    })
  );
  expect(location).toBe('https://app.example.com/two-factor');
});

test('redirectToChallenge keeps a query already on the two factor page url', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: 'https://app.example.com',
      ctx: createCtx({ location: 'https://app.example.com/invoices' }),
      twoFactorPageUrl: 'https://app.example.com/two-factor?method=totp',
    })
  );
  const url = new URL(location);
  expect(url.searchParams.get('method')).toBe('totp');
  expect(url.searchParams.get('callbackUrl')).toBe('/invoices');
});

test('redirectToChallenge round-trips a destination query containing & and ?', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: 'https://app.example.com',
      ctx: createCtx({ location: 'https://app.example.com/reports?a=1&b=2%3Fc' }),
      twoFactorPageUrl: 'https://app.example.com/two-factor',
    })
  );
  expect(new URL(location).searchParams.get('callbackUrl')).toBe('/reports?a=1&b=2%3Fc');
  const raw = location.split('callbackUrl=')[1];
  expect(decodeURIComponent(raw)).toBe('/reports?a=1&b=2%3Fc');
});

test('redirectToChallenge returns a path-relative location and leaks no placeholder origin when no base origin is pinned', () => {
  const location = catchRedirect(() =>
    redirectToChallenge({
      baseUrlOrigin: undefined,
      ctx: createCtx({ location: '/app/invoices/123' }),
      twoFactorPageUrl: '/app/two-factor',
    })
  );
  expect(location).toBe('/app/two-factor?callbackUrl=%2Fapp%2Finvoices%2F123');
  expect(location).not.toContain('lowdefy.invalid');
});
