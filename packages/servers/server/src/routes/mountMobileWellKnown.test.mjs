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

import mountMobileWellKnown from './mountMobileWellKnown.js';
import wellKnownFallbackHandler from './wellKnownFallback.js';

function createApp({ mobileConfig, basePath = '' }) {
  const app = new Hono();
  mountMobileWellKnown({ app, basePath, mobileConfig });
  app.all('/.well-known/*', wellKnownFallbackHandler);
  return app;
}

test('mountMobileWellKnown serves both documents when shells take iOS and Android links', async () => {
  const app = createApp({
    mobileConfig: {
      shells: [
        { id: 'ios', ios: { bundleId: 'com.example.ios', teamId: 'TEAM1' } },
        { id: 'droid', android: { package: 'com.example.droid', sha256: ['AA:BB'] } },
      ],
    },
    basePath: '/app',
  });
  const aasa = await app.request('/.well-known/apple-app-site-association');
  expect(aasa.status).toEqual(200);
  const aasaBody = await aasa.json();
  expect(aasaBody.applinks.details[0].appIDs).toEqual(['TEAM1.com.example.ios']);
  expect(aasaBody.applinks.details[0].components).toEqual([
    { '/': '/app/api/*', exclude: true },
    { '/': '/app/*' },
  ]);
  const assetLinks = await app.request('/.well-known/assetlinks.json');
  expect(assetLinks.status).toEqual(200);
  expect((await assetLinks.json())[0].target.package_name).toEqual('com.example.droid');
});

test('mountMobileWellKnown leaves both to the 404 catch-all for an app without shells', async () => {
  const app = createApp({ mobileConfig: {} });
  const aasa = await app.request('/.well-known/apple-app-site-association');
  expect(aasa.status).toEqual(404);
  expect((await aasa.json()).name).toEqual('NotFoundError');
  const assetLinks = await app.request('/.well-known/assetlinks.json');
  expect(assetLinks.status).toEqual(404);
});

test('mountMobileWellKnown serves only the document a shell needs', async () => {
  const app = createApp({
    mobileConfig: { shells: [{ id: 'ios', ios: { bundleId: 'com.example.ios', teamId: 'T' } }] },
  });
  expect((await app.request('/.well-known/apple-app-site-association')).status).toEqual(200);
  expect((await app.request('/.well-known/assetlinks.json')).status).toEqual(404);
});

test('the catch-all still answers other well-known paths', async () => {
  const app = createApp({
    mobileConfig: { shells: [{ id: 'ios', ios: { bundleId: 'com.example.ios', teamId: 'T' } }] },
  });
  const res = await app.request('/.well-known/openid-configuration');
  expect(res.status).toEqual(404);
});
