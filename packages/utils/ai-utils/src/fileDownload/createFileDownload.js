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

import createConnectPublic from '@lowdefy/node-utils/createConnectPublic.js';
import { Agent, fetch } from 'undici';

import createFileDownloadError from './createFileDownloadError.js';

const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;
const DEFAULT_TIMEOUT = 30000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 10;

const dispatcher = new Agent({
  connect: createConnectPublic({
    createNotPublicError: (hostname) =>
      createFileDownloadError({
        code: 'url_not_public',
        message: `Agent file link to ${hostname} leads to an address that is not public.`,
      }),
  }),
});

function parseHttps(link) {
  const parsed = URL.parse(link);
  return parsed?.protocol === 'https:' ? parsed : null;
}

async function fetchOnce({ link, signal }) {
  try {
    return await fetch(link.href, { dispatcher, redirect: 'manual', signal });
  } catch (error) {
    if (signal.aborted) throw error;
    if (error.cause?.code === 'url_not_public') throw error.cause;
    throw createFileDownloadError({
      code: 'fetch_failed',
      message: `Agent could not download a file from ${link.hostname}: ${
        error.cause?.message ?? error.message
      }`,
      cause: error,
    });
  }
}

// Follows redirects by hand, so each link is checked to be https: before it is requested. The
// dispatcher checks each link's address as it connects.
async function fetchFile({ link, signal }) {
  let current = link;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetchOnce({ link: current, signal });
    const location = response.headers.get('location');
    if (!REDIRECT_STATUSES.has(response.status) || location === null) {
      return response;
    }
    await response.body?.cancel();
    const next = parseHttps(URL.parse(location, current.href)?.href ?? '');
    if (next === null) {
      throw createFileDownloadError({
        code: 'url_not_https',
        message: `Agent file link to ${current.hostname} redirected to a link that is not https:.`,
      });
    }
    current = next;
  }
  throw createFileDownloadError({
    code: 'fetch_failed',
    message: `Agent file link to ${link.hostname} redirected more than ${MAX_REDIRECTS} times.`,
  });
}

async function readBody({ response, maxBytes, hostname }) {
  const tooLarge = () =>
    createFileDownloadError({
      code: 'too_large',
      message: `Agent file from ${hostname} is larger than fileDownload.maxBytes (${maxBytes} bytes).`,
    });
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null && Number(declaredLength) > maxBytes) {
    await response.body?.cancel();
    throw tooLarge();
  }
  const chunks = [];
  let size = 0;
  // Leaving the loop by a throw cancels the body, so nothing past maxBytes is read.
  for await (const chunk of response.body ?? []) {
    size += chunk.byteLength;
    if (size > maxBytes) {
      throw tooLarge();
    }
    chunks.push(chunk);
  }
  return new Uint8Array(Buffer.concat(chunks, size));
}

// The agent's download function for file links the model does not take as links: an https: link
// to a public address, read within maxBytes and timeout. A link the model takes is left to the
// provider (null).
function createFileDownload({ maxBytes = DEFAULT_MAX_BYTES, timeout = DEFAULT_TIMEOUT, signal }) {
  async function download(url) {
    const link = parseHttps(url.toString());
    if (link === null) {
      throw createFileDownloadError({
        code: 'url_not_https',
        message: 'Agent file links the server downloads must be https: links.',
      });
    }
    const timeoutSignal = AbortSignal.timeout(timeout);
    const fetchSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
    try {
      const response = await fetchFile({ link, signal: fetchSignal });
      if (!response.ok) {
        await response.body?.cancel();
        throw createFileDownloadError({
          code: 'fetch_failed',
          message: `Agent file link to ${link.hostname} answered ${response.status}.`,
          status: response.status,
        });
      }
      const data = await readBody({ response, maxBytes, hostname: link.hostname });
      return { data, mediaType: response.headers.get('content-type') ?? undefined };
    } catch (error) {
      if (timeoutSignal.aborted) {
        throw createFileDownloadError({
          code: 'timeout',
          message: `Agent file from ${link.hostname} did not download within fileDownload.timeout (${timeout} ms).`,
          cause: error,
        });
      }
      throw error;
    }
  }

  return (requestedDownloads) =>
    Promise.all(
      requestedDownloads.map(({ url, isUrlSupportedByModel }) =>
        isUrlSupportedByModel ? null : download(url)
      )
    );
}

export default createFileDownload;
