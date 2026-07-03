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

import buildAuthStrategies from './buildAuthStrategies.js';

test('buildAuthStrategies returns components unchanged when strategies is undefined', () => {
  const components = {
    auth: {},
  };
  const res = buildAuthStrategies({ components });
  expect(res).toEqual({ auth: {} });
});

test('buildAuthStrategies is a no-op for an empty strategies array', () => {
  const components = {
    auth: {
      strategies: [],
    },
  };
  const res = buildAuthStrategies({ components });
  expect(res).toEqual({ auth: { strategies: [] } });
});

test('buildAuthStrategies passes a valid apiKey strategy and writes defaults', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: {
            keys: [{ id: 'acme', value: { _secret: 'PARTNER_KEY_ACME' } }],
          },
        },
      ],
    },
  };
  const res = buildAuthStrategies({ components });
  expect(res.auth.strategies).toEqual([
    {
      id: 'partner-access',
      type: 'apiKey',
      properties: {
        headerName: 'X-API-Key',
        keys: [{ id: 'acme', value: { _secret: 'PARTNER_KEY_ACME' } }],
      },
      roles: [],
      attributes: {},
    },
  ]);
});

test('buildAuthStrategies passes a valid jwt strategy with an HMAC secret and writes defaults', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'service-jwt',
          type: 'jwt',
          properties: {
            secret: { _secret: 'JWT_SIGNING_SECRET' },
            algorithms: ['HS256'],
          },
        },
      ],
    },
  };
  const res = buildAuthStrategies({ components });
  expect(res.auth.strategies).toEqual([
    {
      id: 'service-jwt',
      type: 'jwt',
      properties: {
        secret: { _secret: 'JWT_SIGNING_SECRET' },
        algorithms: ['HS256'],
      },
      roles: [],
      attributes: {},
    },
  ]);
});

test('buildAuthStrategies passes a valid jwt strategy with a jwksUri and writes defaults', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'idp-jwt',
          type: 'jwt',
          properties: {
            jwksUri: 'https://auth.example.com/.well-known/jwks.json',
            algorithms: ['RS256'],
            issuer: 'https://auth.example.com',
            audience: 'my-lowdefy-api',
          },
        },
      ],
    },
  };
  const res = buildAuthStrategies({ components });
  expect(res.auth.strategies).toEqual([
    {
      id: 'idp-jwt',
      type: 'jwt',
      properties: {
        jwksUri: 'https://auth.example.com/.well-known/jwks.json',
        algorithms: ['RS256'],
        issuer: 'https://auth.example.com',
        audience: 'my-lowdefy-api',
      },
      roles: [],
      attributes: {},
    },
  ]);
});

test('buildAuthStrategies preserves explicit roles, attributes and headerName', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: {
            headerName: 'X-Partner-Key',
            keys: [{ value: { _secret: 'PARTNER_KEY' } }],
          },
          roles: ['partner'],
          attributes: { branches: ['north', 'east'] },
        },
      ],
    },
  };
  const res = buildAuthStrategies({ components });
  expect(res.auth.strategies).toEqual([
    {
      id: 'partner-access',
      type: 'apiKey',
      properties: {
        headerName: 'X-Partner-Key',
        keys: [{ value: { _secret: 'PARTNER_KEY' } }],
      },
      roles: ['partner'],
      attributes: { branches: ['north', 'east'] },
    },
  ]);
});

test('buildAuthStrategies throws when two strategies share an id', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: { keys: [{ value: { _secret: 'KEY_A' } }] },
        },
        {
          id: 'partner-access',
          type: 'jwt',
          properties: { secret: { _secret: 'JWT_SECRET' }, algorithms: ['HS256'] },
        },
      ],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Duplicate auth strategy id "partner-access".'
  );
});

test('buildAuthStrategies throws when a strategy has an unknown type', () => {
  const components = {
    auth: {
      strategies: [{ id: 'basic-auth', type: 'basic', properties: {} }],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "basic-auth" has unknown type "basic". Valid types are: apiKey, jwt.'
  );
});

test('buildAuthStrategies throws when an apiKey strategy has no keys', () => {
  const components = {
    auth: {
      strategies: [{ id: 'partner-access', type: 'apiKey', properties: {} }],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "partner-access" requires "properties.keys" to be a non-empty array of keys.'
  );
});

test('buildAuthStrategies throws when an apiKey strategy has an empty keys array', () => {
  const components = {
    auth: {
      strategies: [{ id: 'partner-access', type: 'apiKey', properties: { keys: [] } }],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "partner-access" requires "properties.keys" to be a non-empty array of keys.'
  );
});

test('buildAuthStrategies throws when an apiKey key entry is missing a value', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: {
            keys: [{ id: 'acme', value: { _secret: 'PARTNER_KEY_ACME' } }, { id: 'globex' }],
          },
        },
      ],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "partner-access" key at index 1 is missing "value". Reference the key with the _secret operator.'
  );
});

test('buildAuthStrategies throws when a jwt strategy sets both secret and jwksUri', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'service-jwt',
          type: 'jwt',
          properties: {
            secret: { _secret: 'JWT_SIGNING_SECRET' },
            jwksUri: 'https://auth.example.com/.well-known/jwks.json',
            algorithms: ['HS256'],
          },
        },
      ],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "service-jwt" requires exactly one of "properties.secret" or "properties.jwksUri" to verify token signatures.'
  );
});

test('buildAuthStrategies throws when a jwt strategy sets neither secret nor jwksUri', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'service-jwt',
          type: 'jwt',
          properties: { algorithms: ['HS256'] },
        },
      ],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "service-jwt" requires exactly one of "properties.secret" or "properties.jwksUri" to verify token signatures.'
  );
});

test('buildAuthStrategies throws when a jwt strategy has no algorithms', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'service-jwt',
          type: 'jwt',
          properties: { secret: { _secret: 'JWT_SIGNING_SECRET' } },
        },
      ],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "service-jwt" requires "properties.algorithms" to be a non-empty array restricting the accepted signing algorithms.'
  );
});

test('buildAuthStrategies throws when a jwt strategy has an empty algorithms array', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'service-jwt',
          type: 'jwt',
          properties: { secret: { _secret: 'JWT_SIGNING_SECRET' }, algorithms: [] },
        },
      ],
    },
  };
  expect(() => buildAuthStrategies({ components })).toThrow(
    'Auth strategy "service-jwt" requires "properties.algorithms" to be a non-empty array restricting the accepted signing algorithms.'
  );
});
