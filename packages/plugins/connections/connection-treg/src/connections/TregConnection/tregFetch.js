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

import { ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import redactToken from './redactToken.js';

const DEFAULT_BASE_URL = 'https://treg.to';
const DEFAULT_TIMEOUT_MS = 30000;

function buildUrl({ baseUrl, path, query }) {
  const base = new URL(baseUrl);
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}${path}`);
  // The URL parser drops tabs and newlines, resolves "." and ".." segments (also encoded)
  // and turns backslashes into slashes, so a path that looked safe can reach another /call/
  // target, where treg injects the team's credential. Only a path the parser keeps exactly
  // as written is sent.
  const expectedPath = `${base.pathname.replace(/\/+$/, '')}${path}`;
  if (
    url.origin !== base.origin ||
    url.pathname !== expectedPath ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new Error(
      `The treg path ${JSON.stringify(
        path
      )} is not kept as written by the URL parser, so it is not sent.`
    );
  }
  Object.entries(query ?? {}).forEach(([key, value]) => {
    const values = type.isArray(value) ? value : [value];
    values
      .filter((item) => !type.isNone(item))
      .forEach((item) => url.searchParams.append(key, String(item)));
  });
  return url;
}

function parseBody(text) {
  if (text === '') return null;
  // A provider body is relayed verbatim and need not be JSON.
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// One HTTP call to treg. Every call carries the token (and the team for an identity token);
// the token lives only in this header, never in the URL, so no error or log that names the
// URL can leak it. Redirects are not followed: a redirect to another host would carry the
// token along with it.
async function tregFetch({ connection, method = 'GET', path, query, headers, body, signal }) {
  const timeout = connection.timeout ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl({ baseUrl: connection.baseUrl ?? DEFAULT_BASE_URL, path, query });
  const requestHeaders = {
    accept: 'application/json',
    'x-treg-token': connection.token,
    ...(type.isString(connection.org) ? { 'x-treg-org': connection.org } : {}),
    ...(type.isUndefined(body) ? {} : { 'content-type': 'application/json' }),
    ...headers,
  };
  const timeoutSignal = AbortSignal.timeout(timeout);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: type.isUndefined(body) ? undefined : JSON.stringify(body),
      redirect: 'manual',
      signal: combinedSignal,
    });
    const text = await response.text();
    return { status: response.status, headers: response.headers, body: parseBody(text) };
  } catch (error) {
    // The request that started this call closed: the API layer reports the cancellation.
    if (signal?.aborted) throw error;
    if (timeoutSignal.aborted) {
      throw new ServiceError(`Did not answer within ${timeout} ms.`, {
        service: 'treg',
        code: 'ETIMEDOUT',
      });
    }
    const code = error.cause?.code ?? error.code;
    const reason = redactToken({
      text: error.cause?.message ?? error.message,
      token: connection.token,
    });
    throw new ServiceError(`Could not be reached (${reason}).`, { service: 'treg', code });
  }
}

export default tregFetch;
