/*
  Copyright 2020-2021 Lowdefy, Inc

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

import openIdLogoutUrl from './openIdLogoutUrl';
import testContext from '../../test/testContext';
import unsetAuthorizationCookie from './unsetAuthorizationCookie';
import { AuthenticationError } from '../../context/errors';

jest.mock('./unsetAuthorizationCookie');

const secrets = {
  OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
  OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
  OPENID_DOMAIN: 'OPENID_DOMAIN',
  JWT_SECRET: 'JWT_SECRET',
};

beforeEach(() => {
  unsetAuthorizationCookie.mockReset();
});

test('logout, no openId config', () => {
  const context = testContext({});
  expect(() => openIdLogoutUrl(context, { idToken: 'idToken' })).toThrow(
    'Invalid OpenID Connect configuration.'
  );
  expect(unsetAuthorizationCookie).toHaveBeenCalled();
});

test('logout with logoutRedirectUri', () => {
  const context = testContext({
    secrets,
    config: {
      auth: {
        openId: {
          logoutRedirectUri:
            '{{ openid_domain }}/logout/?id_token_hint={{ id_token_hint }}&client_id={{ client_id }}&return_to={{ host }}%2Flogged-out',
        },
      },
    },
  });

  const url = openIdLogoutUrl(context, { idToken: 'idToken' });
  expect(url).toEqual({
    openIdLogoutUrl:
      'OPENID_DOMAIN/logout/?id_token_hint=idToken&client_id=OPENID_CLIENT_ID&return_to=https%3A%2F%2Fhost%2Flogged-out',
  });
  expect(unsetAuthorizationCookie).toHaveBeenCalled();
});

test('logout with logoutRedirectUri, protocol is http', () => {
  const context = testContext({
    secrets,
    protocol: 'http',
    config: {
      auth: {
        openId: {
          logoutRedirectUri:
            '{{ openid_domain }}/logout/?id_token_hint={{ id_token_hint }}&client_id={{ client_id }}&return_to={{ host }}%2Flogged-out',
        },
      },
    },
  });

  const url = openIdLogoutUrl(context, { idToken: 'idToken' });
  expect(url).toEqual({
    openIdLogoutUrl:
      'OPENID_DOMAIN/logout/?id_token_hint=idToken&client_id=OPENID_CLIENT_ID&return_to=http%3A%2F%2Fhost%2Flogged-out',
  });
  expect(unsetAuthorizationCookie).toHaveBeenCalled();
});

test('logout with logoutRedirectUri, invalid template', () => {
  const context = testContext({
    secrets,
    protocol: 'http',
    config: {
      auth: {
        openId: {
          logoutRedirectUri: '{{ openid_domain ',
        },
      },
    },
  });

  expect(() => openIdLogoutUrl(context, { idToken: 'idToken' })).toThrow(AuthenticationError);
  expect(() => openIdLogoutUrl(context, { idToken: 'idToken' })).toThrow('Template render error');
});
