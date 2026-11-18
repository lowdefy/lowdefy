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

// A browser cannot set headers on a websocket handshake, so a view sends its
// bearer session in Sec-WebSocket-Protocol. It offers exactly two subprotocols,
// in this order:
//
//   1. lowdefy.view
//   2. lowdefy.view.bearer.<the bearer token, UTF-8, base64url without padding>
//
// A subprotocol must be an HTTP token, which a signed session token is not, so
// the bearer is base64url encoded. The server answers with the first name
// only: the ws server selects the first subprotocol offered, and any other
// offer is not read as a view's, so the token is never sent back.
const VIEW_SOCKET_PROTOCOL = 'lowdefy.view';
const VIEW_SOCKET_BEARER_PREFIX = 'lowdefy.view.bearer.';
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

// Returns the bearer token a view's handshake carries, or null when the
// Sec-WebSocket-Protocol header is not a view's offer.
function readViewSocketToken({ header }) {
  if (typeof header !== 'string') {
    return null;
  }
  const protocols = header.split(',').map((protocol) => protocol.trim());
  if (protocols.length !== 2 || protocols[0] !== VIEW_SOCKET_PROTOCOL) {
    return null;
  }
  if (!protocols[1].startsWith(VIEW_SOCKET_BEARER_PREFIX)) {
    return null;
  }
  const encoded = protocols[1].slice(VIEW_SOCKET_BEARER_PREFIX.length);
  if (!BASE64URL_REGEX.test(encoded)) {
    return null;
  }
  const token = Buffer.from(encoded, 'base64url').toString('utf8');
  return token === '' ? null : token;
}

export { VIEW_SOCKET_BEARER_PREFIX, VIEW_SOCKET_PROTOCOL };

export default readViewSocketToken;
