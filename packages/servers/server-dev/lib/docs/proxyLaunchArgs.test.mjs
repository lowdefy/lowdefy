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

import { expect, test } from 'vitest';

import proxyLaunchArgs from './proxyLaunchArgs.js';

const origin = 'http://localhost:3001';

test('proxyLaunchArgs turns every proxy off when the environment names none', () => {
  expect(proxyLaunchArgs({ origin, env: {} })).toEqual(['--no-proxy-server']);
  expect(proxyLaunchArgs({ origin, env: { HTTP_PROXY: '' } })).toEqual(['--no-proxy-server']);
});

test('proxyLaunchArgs keeps the environment proxy and sends the origin port direct', () => {
  expect(
    proxyLaunchArgs({
      origin,
      env: { HTTP_PROXY: 'http://proxy:8080', https_proxy: 'http://proxy:8443' },
    })
  ).toEqual([
    '--proxy-server=http=http://proxy:8080;https=http://proxy:8443',
    '--proxy-bypass-list=*:3001',
  ]);
});

test('proxyLaunchArgs uses ALL_PROXY when no scheme proxy is named', () => {
  expect(proxyLaunchArgs({ origin, env: { ALL_PROXY: 'socks5://proxy:1080' } })).toEqual([
    '--proxy-server=socks5://proxy:1080',
    '--proxy-bypass-list=*:3001',
  ]);
});

test('proxyLaunchArgs adds NO_PROXY entries to the bypass list, a leading dot as a wildcard', () => {
  expect(
    proxyLaunchArgs({
      origin,
      env: { HTTPS_PROXY: 'http://proxy:8443', NO_PROXY: 'internal.test, .corp.test,,10.0.0.0/8' },
    })
  ).toEqual([
    '--proxy-server=https=http://proxy:8443',
    '--proxy-bypass-list=*:3001;internal.test;*.corp.test;10.0.0.0/8',
  ]);
});

test('proxyLaunchArgs turns every proxy off when NO_PROXY is a wildcard', () => {
  expect(
    proxyLaunchArgs({ origin, env: { HTTP_PROXY: 'http://proxy:8080', no_proxy: '*' } })
  ).toEqual(['--no-proxy-server']);
});

test('proxyLaunchArgs bypasses the default port of an origin that names none', () => {
  expect(
    proxyLaunchArgs({ origin: 'https://dev.example.test', env: { HTTPS_PROXY: 'http://p:1' } })
  ).toEqual(['--proxy-server=https=http://p:1', '--proxy-bypass-list=*:443']);
});
