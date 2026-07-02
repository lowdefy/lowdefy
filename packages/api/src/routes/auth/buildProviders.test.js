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

import { jest } from '@jest/globals';
import { ConfigError } from '@lowdefy/errors';

import buildProviders from './buildProviders.js';

function Google({ id, properties }) {
  return { kind: 'social', provider: 'google', options: properties };
}

function GitHub({ id, properties }) {
  return { kind: 'social', provider: 'github', options: properties };
}

function GenericOAuth({ id, properties }) {
  return { kind: 'generic', config: { providerId: id, ...properties } };
}

const plugins = {
  providers: {
    Google,
    GitHub,
    GenericOAuth,
  },
};

test('returns empty socialProviders and genericOAuthConfigs when providers is empty', () => {
  const authConfig = { providers: [] };
  const result = buildProviders({ authConfig, plugins });
  expect(result).toEqual({ socialProviders: {}, genericOAuthConfigs: [] });
});

test('returns empty socialProviders and genericOAuthConfigs when providers is undefined', () => {
  const authConfig = {};
  const result = buildProviders({ authConfig, plugins });
  expect(result).toEqual({ socialProviders: {}, genericOAuthConfigs: [] });
});

test('maps a built-in provider into socialProviders keyed by the plugin provider key', () => {
  const authConfig = {
    providers: [
      { id: 'google', type: 'Google', properties: { clientId: 'cid', clientSecret: 'csecret' } },
    ],
  };
  const result = buildProviders({ authConfig, plugins });
  expect(result).toEqual({
    socialProviders: { google: { clientId: 'cid', clientSecret: 'csecret' } },
    genericOAuthConfigs: [],
  });
});

test('maps multiple built-in providers into distinct socialProviders keys', () => {
  const authConfig = {
    providers: [
      { id: 'google', type: 'Google', properties: { clientId: 'g' } },
      { id: 'github', type: 'GitHub', properties: { clientId: 'h' } },
    ],
  };
  const result = buildProviders({ authConfig, plugins });
  expect(result).toEqual({
    socialProviders: {
      google: { clientId: 'g' },
      github: { clientId: 'h' },
    },
    genericOAuthConfigs: [],
  });
});

test('maps a GenericOAuth provider into genericOAuthConfigs keyed by the Lowdefy provider id', () => {
  const authConfig = {
    providers: [
      {
        id: 'okta',
        type: 'GenericOAuth',
        properties: { clientId: 'cid', authorizationUrl: 'https://okta.example.com/auth' },
      },
    ],
  };
  const result = buildProviders({ authConfig, plugins });
  expect(result).toEqual({
    socialProviders: {},
    genericOAuthConfigs: [
      { providerId: 'okta', clientId: 'cid', authorizationUrl: 'https://okta.example.com/auth' },
    ],
  });
});

test('defaults provider properties to an empty object when not set', () => {
  const providerPlugin = jest.fn(() => ({ kind: 'social', provider: 'google', options: {} }));
  const authConfig = { providers: [{ id: 'google', type: 'Google' }] };
  buildProviders({ authConfig, plugins: { providers: { Google: providerPlugin } } });
  expect(providerPlugin).toHaveBeenCalledWith({ id: 'google', properties: {} });
});

test('mixes built-in and generic providers in a single call', () => {
  const authConfig = {
    providers: [
      { id: 'google', type: 'Google', properties: { clientId: 'g' } },
      { id: 'okta', type: 'GenericOAuth', properties: { clientId: 'o' } },
    ],
  };
  const result = buildProviders({ authConfig, plugins });
  expect(result).toEqual({
    socialProviders: { google: { clientId: 'g' } },
    genericOAuthConfigs: [{ providerId: 'okta', clientId: 'o' }],
  });
});

test('throws ConfigError when provider type is not found in the plugin registry', () => {
  const authConfig = {
    providers: [{ id: 'facebook', type: 'Facebook', properties: {}, '~k': 'auth.providers[0]' }],
  };
  expect(() => buildProviders({ authConfig, plugins })).toThrow(ConfigError);
  expect(() => buildProviders({ authConfig, plugins })).toThrow(
    'Auth provider type "Facebook" not found at provider "facebook".'
  );
  try {
    buildProviders({ authConfig, plugins });
  } catch (e) {
    expect(e.configKey).toBe('auth.providers[0]');
  }
});

test('throws ConfigError when a built-in provider is configured more than once', () => {
  const authConfig = {
    providers: [
      { id: 'google-1', type: 'Google', properties: { clientId: 'a' } },
      { id: 'google-2', type: 'Google', properties: { clientId: 'b' }, '~k': 'auth.providers[1]' },
    ],
  };
  expect(() => buildProviders({ authConfig, plugins })).toThrow(ConfigError);
  expect(() => buildProviders({ authConfig, plugins })).toThrow(
    'Auth provider "google" is configured more than once. BetterAuth supports one configuration per built-in provider.'
  );
  try {
    buildProviders({ authConfig, plugins });
  } catch (e) {
    expect(e.configKey).toBe('auth.providers[1]');
  }
});

test('does not throw when multiple GenericOAuth providers share different ids', () => {
  const authConfig = {
    providers: [
      { id: 'okta', type: 'GenericOAuth', properties: { clientId: 'a' } },
      { id: 'auth0', type: 'GenericOAuth', properties: { clientId: 'b' } },
    ],
  };
  const result = buildProviders({ authConfig, plugins });
  expect(result.genericOAuthConfigs).toEqual([
    { providerId: 'okta', clientId: 'a' },
    { providerId: 'auth0', clientId: 'b' },
  ]);
});
