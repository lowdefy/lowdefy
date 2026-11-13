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

import http from 'node:http';
import https from 'node:https';

import { expect, test } from 'vitest';

import createAxiosConfig from './createAxiosConfig.js';

const url = 'https://api.example.com/things';

test('createAxiosConfig uses the http adapter and ignores proxy environment variables by default', () => {
  const config = createAxiosConfig({ connection: {}, request: { url } });
  expect(config.adapter).toBe('http');
  expect(config.proxy).toBe(false);
  expect(config.httpAgent).toBeInstanceOf(http.Agent);
  expect(config.httpsAgent).toBeInstanceOf(https.Agent);
  expect(typeof config.httpAgent.options.lookup).toBe('function');
  expect(typeof config.httpsAgent.options.lookup).toBe('function');
});

test('createAxiosConfig passes connection agent options to the checked agents, keeping the checked lookup', () => {
  const lookup = () => {};
  const config = createAxiosConfig({
    connection: { httpsAgentOptions: { keepAlive: true, lookup } },
    request: { url },
  });
  expect(config.httpsAgent.options.keepAlive).toBe(true);
  expect(config.httpsAgent.options.lookup).not.toBe(lookup);
  expect(config.httpsAgentOptions).toBeUndefined();
});

test('createAxiosConfig keeps the connection value of connection-only properties over the request value', () => {
  const config = createAxiosConfig({
    connection: { allowedHosts: ['api.example.com'], allowAbsoluteUrls: false },
    request: {
      url,
      allowedHosts: ['internal.example.com'],
      allowAbsoluteUrls: true,
      allowInternalAddresses: true,
    },
  });
  expect(config.allowAbsoluteUrls).toBe(false);
  expect(config.proxy).toBe(false);
  expect(typeof config.httpsAgent.options.lookup).toBe('function');
});

test('createAxiosConfig drops socketPath, proxy and httpVersion set on the request', () => {
  const config = createAxiosConfig({
    connection: {},
    request: {
      url,
      socketPath: '/var/run/docker.sock',
      proxy: { host: '10.0.0.1', port: 3128 },
      httpVersion: 2,
    },
  });
  expect(config.socketPath).toBeUndefined();
  expect(config.proxy).toBe(false);
  expect(config.httpVersion).toBeUndefined();
});

test('createAxiosConfig overrides adapter, transport, lookup and agents from a connection or request', () => {
  const config = createAxiosConfig({
    connection: { adapter: 'fetch', lookup: 'x' },
    request: { url, transport: 'x', httpAgent: {}, httpsAgent: {}, beforeRedirect: 'x' },
  });
  expect(config.adapter).toBe('http');
  expect(config.transport).toBeUndefined();
  expect(config.lookup).toBeUndefined();
  expect(config.httpAgent).toBeInstanceOf(http.Agent);
  expect(config.httpsAgent).toBeInstanceOf(https.Agent);
  expect(typeof config.beforeRedirect).toBe('function');
});

test('createAxiosConfig throws for a connection socketPath without allowInternalAddresses', () => {
  expect(() =>
    createAxiosConfig({ connection: { socketPath: '/var/run/docker.sock' }, request: { url } })
  ).toThrow(
    'AxiosHttp property "socketPath" needs "allowInternalAddresses: true" on the connection.'
  );
});

test('createAxiosConfig throws for a connection proxy without allowInternalAddresses', () => {
  expect(() =>
    createAxiosConfig({ connection: { proxy: { host: 'proxy.example.com' } }, request: { url } })
  ).toThrow('AxiosHttp property "proxy" needs "allowInternalAddresses: true" on the connection');
});

test('createAxiosConfig throws for a connection httpVersion 2 without allowInternalAddresses', () => {
  expect(() => createAxiosConfig({ connection: { httpVersion: 2 }, request: { url } })).toThrow(
    'AxiosHttp property "httpVersion: 2" needs "allowInternalAddresses: true" on the connection'
  );
});

test('createAxiosConfig with allowInternalAddresses keeps socketPath and proxy and uses unchecked agents', () => {
  const proxy = { host: '10.0.0.1', port: 3128 };
  const config = createAxiosConfig({
    connection: {
      allowInternalAddresses: true,
      socketPath: '/var/run/docker.sock',
      proxy,
      httpAgentOptions: { keepAlive: true },
    },
    request: { url },
  });
  expect(config.socketPath).toBe('/var/run/docker.sock');
  expect(config.proxy).toEqual(proxy);
  expect(config.httpAgent.options.lookup).toBeUndefined();
  expect(config.httpAgent.options.keepAlive).toBe(true);
  expect(config.httpsAgent).toBeUndefined();
  expect(config.allowInternalAddresses).toBeUndefined();
});

test('createAxiosConfig refuses a url whose host is not in allowedHosts', () => {
  expect(() =>
    createAxiosConfig({
      connection: { allowedHosts: ['api.example.com'] },
      request: { url: 'https://other.example.com/things' },
    })
  ).toThrow(
    'AxiosHttp request to "other.example.com" was refused because the host is not in the connection\'s "allowedHosts".'
  );
});

test('createAxiosConfig checks allowedHosts against the url resolved with baseURL', () => {
  const connection = { baseURL: 'https://API.example.com/v1', allowedHosts: ['api.example.com'] };
  expect(() => createAxiosConfig({ connection, request: { url: '/things' } })).not.toThrow();
  expect(() =>
    createAxiosConfig({ connection, request: { url: 'https://other.example.com/things' } })
  ).toThrow('"other.example.com" was refused');
});

test('createAxiosConfig checks allowedHosts on a redirect', () => {
  const config = createAxiosConfig({
    connection: { allowedHosts: ['api.example.com'] },
    request: { url },
  });
  expect(() => config.beforeRedirect({ href: 'https://api.example.com/next' })).not.toThrow();
  expect(() => config.beforeRedirect({ href: 'http://169.254.169.254/latest' })).toThrow(
    '"169.254.169.254" was refused because the host is not in the connection\'s "allowedHosts".'
  );
});
