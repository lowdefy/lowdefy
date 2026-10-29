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

import { type } from '@lowdefy/helpers';

import isSameOriginRequest from '../../context/isSameOriginRequest.js';

// BetterAuth reads the client address (its rate-limit key, the session's
// ipAddress, the captcha remote IP) only from request headers. The server
// resolves the address itself - from the connection and the app's trusted
// proxies - and hands it over in this header, which getBetterAuthConfig names
// as the one BetterAuth reads. Any copy the client sent is replaced, so the
// header carries only what the server resolved.
const CLIENT_ADDRESS_HEADER = 'x-lowdefy-client-address';

// The fields MagicLinkVerify posts: the token and the destinations BetterAuth
// put on the verify URL it minted. Nothing else is carried onto the verify
// query.
const MAGIC_LINK_VERIFY_FIELDS = ['token', 'callbackURL', 'newUserCallbackURL', 'errorCallbackURL'];

// A form of four short fields. Anything larger is not MagicLinkVerify.
const MAX_MAGIC_LINK_FORM_LENGTH = 8192;

function isMagicLinkVerifyPost({ auth, request }) {
  return (
    request.method === 'POST' &&
    new URL(request.url).pathname === `${auth.options.basePath}/magic-link/verify`
  );
}

// The magic-link landing page posts the token rather than navigating to
// BetterAuth's GET verify URL, so the token never sits in a URL the server,
// its host's request logs or a Referer header receive. The post becomes the
// GET BetterAuth serves, built inside the server and handed to auth.handler as
// a real Request, so BetterAuth's checks and Lowdefy's request hooks run as
// on the GET path. BetterAuth checks no Origin on a GET, so the post's Origin
// is checked here: a post from another site would sign the visitor in to the
// account whose token that site holds. The origins accepted are the request's
// own host and the pinned base URL (the origins BetterAuth trusts), as for the
// mobile sign-in confirmation.
async function getMagicLinkVerifyRequest({ auth, request, headers }) {
  const sameOrigin = isSameOriginRequest({
    getHeader: (name) => request.headers.get(name),
    publicOrigins: [
      auth.options.baseURL,
      ...(type.isArray(auth.options.trustedOrigins) ? auth.options.trustedOrigins : []),
    ].filter((origin) => type.isString(origin)),
  });
  if (!sameOrigin) {
    return { response: new Response('Forbidden.', { status: 403 }) };
  }
  // Read through a Response: the stand-in @hono/node-server passes may not carry text().
  const body = await new Response(request.body).text();
  if (body.length > MAX_MAGIC_LINK_FORM_LENGTH) {
    return { response: new Response('Request too large.', { status: 413 }) };
  }
  const form = new URLSearchParams(body);
  const verifyUrl = new URL(request.url);
  MAGIC_LINK_VERIFY_FIELDS.forEach((field) => {
    if (form.has(field)) {
      verifyUrl.searchParams.set(field, form.get(field));
    }
  });
  headers.delete('content-type');
  headers.delete('content-length');
  return {
    request: new Request(verifyUrl.href, {
      method: 'GET',
      headers,
      signal: request.signal,
    }),
  };
}

// The new Request is built from the incoming one's parts rather than cloned
// from it: @hono/node-server hands the app a lightweight stand-in for a
// Request, which only its own copy's Request constructor accepts as input,
// and the dev server loads two copies.
async function handleAuthRequest({ auth, request, clientAddress }) {
  const headers = new Headers(request.headers);
  headers.delete(CLIENT_ADDRESS_HEADER);
  if (!type.isNone(clientAddress)) {
    headers.set(CLIENT_ADDRESS_HEADER, clientAddress);
  }
  if (isMagicLinkVerifyPost({ auth, request })) {
    const verify = await getMagicLinkVerifyRequest({ auth, request, headers });
    if (verify.response) {
      return verify.response;
    }
    return auth.handler(verify.request);
  }
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return auth.handler(
    new Request(request.url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : null,
      duplex: 'half',
      signal: request.signal,
    })
  );
}

export default handleAuthRequest;
export { CLIENT_ADDRESS_HEADER };
