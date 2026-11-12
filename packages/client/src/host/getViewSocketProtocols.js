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

const VIEW_SOCKET_PROTOCOL = 'lowdefy.view';
const VIEW_SOCKET_BEARER_PREFIX = 'lowdefy.view.bearer.';

// base64url of the text's UTF-8 bytes, without padding.
function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The subprotocols a view offers on its websocket handshake. A browser cannot
// set headers on the handshake, so the bearer session travels in
// Sec-WebSocket-Protocol: a fixed name, then the token. A subprotocol must be
// an HTTP token, which a signed session token is not, so the token is
// base64url encoded. The app's server reads exactly this offer, in this order,
// and answers with the name only (readViewSocketToken in @lowdefy/server).
function getViewSocketProtocols({ token }) {
  return [VIEW_SOCKET_PROTOCOL, `${VIEW_SOCKET_BEARER_PREFIX}${encodeBase64Url(token)}`];
}

export default getViewSocketProtocols;
