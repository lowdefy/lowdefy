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

import GenericOAuth from './GenericOAuth.js';

test('GenericOAuth passes properties through with the Lowdefy id as providerId', () => {
  expect(GenericOAuth({ id: 'idp', properties: { clientId: 'cid', providerId: 'other' } })).toEqual(
    {
      kind: 'generic',
      config: { clientId: 'cid', providerId: 'idp' },
    }
  );
});

test('GenericOAuth with trustEmail maps every profile to a verified email', async () => {
  const { config } = GenericOAuth({ id: 'idp', properties: { clientId: 'cid', trustEmail: true } });
  expect(config.trustEmail).toBeUndefined();
  expect(await config.mapProfileToUser({ email: 'a@example.com' })).toEqual({
    emailVerified: true,
  });
});

test('GenericOAuth without trustEmail sets no profile mapping', () => {
  const { config } = GenericOAuth({ id: 'idp', properties: { trustEmail: false } });
  expect(config).toEqual({ providerId: 'idp' });
});

test('GenericOAuth throws when trustEmail is not a boolean', () => {
  expect(() => GenericOAuth({ id: 'idp', properties: { trustEmail: 'true' } })).toThrow(
    'GenericOAuth property "trustEmail" is not a boolean. Received "true".'
  );
});
