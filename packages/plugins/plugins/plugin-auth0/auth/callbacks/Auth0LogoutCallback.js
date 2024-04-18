/*
  Copyright 2020-2024 Lowdefy, Inc

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

function Auth0LogoutCallback({ url, baseUrl, properties }) {
  if (url === 'AUTH0_LOGOUT') {
    return `${properties.issuer}/v2/logout?returnTo=${encodeURIComponent(
      `${baseUrl}/${properties.returnToPagedId}`
    )}&client_id=${properties.clientId}`;
  }

  // next-auth default redirect callback implementation
  // Allows relative callback URLs
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  // Allows callback URLs on the same origin
  if (new URL(url).origin === baseUrl) {
    return url;
  }
  return baseUrl;
}

Auth0LogoutCallback.meta = {
  type: 'redirect',
};

export default Auth0LogoutCallback;
