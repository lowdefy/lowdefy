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

import { Readable } from 'node:stream';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { type } from '@lowdefy/helpers';
import createConnectPublic from '@lowdefy/node-utils/createConnectPublic.js';
import { Agent, fetch } from 'undici';

import createCopyError from './createCopyError.js';
import limitBody from './limitBody.js';
import matchesContentType from './matchesContentType.js';

async function collect(chunks) {
  const buffers = [];
  for await (const chunk of chunks) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 20;

const dispatcher = new Agent({
  connect: createConnectPublic({
    createNotPublicError: () =>
      createCopyError({
        code: 'url_not_public',
        message: 'AwsS3PutObject "url" leads to an address that is not public.',
      }),
  }),
});

function isHttps(link) {
  return URL.parse(link)?.protocol === 'https:';
}

async function fetchOnce({ url, signal }) {
  try {
    // Asks for the body uncompressed: fetch decodes a compressed body, whose length then no longer
    // matches the Content-Length checked against maxBytes.
    return await fetch(url, {
      headers: { 'accept-encoding': 'identity' },
      dispatcher,
      redirect: 'manual',
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (error.cause?.code === 'url_not_public') throw error.cause;
    // The url is left out of the message: a presigned link carries its signature.
    throw createCopyError({
      code: 'fetch_failed',
      message: `AwsS3PutObject could not fetch the url: ${error.message}`,
      cause: error,
    });
  }
}

// Follows redirects by hand, so each link is checked to be https: before it is requested. The
// dispatcher checks each link's address as it connects.
async function fetchUrl({ url, signal }) {
  let link = url;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetchOnce({ url: link, signal });
    const location = response.headers.get('location');
    if (!REDIRECT_STATUSES.has(response.status) || location === null) {
      return response;
    }
    await response.body?.cancel();
    link = URL.parse(location, link)?.href ?? location;
    if (!isHttps(link)) {
      throw createCopyError({
        code: 'url_not_https',
        message: 'AwsS3PutObject "url" redirected to a link that is not https:.',
      });
    }
  }
  throw createCopyError({
    code: 'fetch_failed',
    message: `AwsS3PutObject url redirected more than ${MAX_REDIRECTS} times.`,
  });
}

// Streams what an https url answers into the bucket, capped at maxBytes. A body with a
// Content-Length streams straight into one PutObject; one without is read into memory, still
// capped at maxBytes, since PutObject needs the length up front.
async function copyFromUrl({ s3, params, request }) {
  const { contentType, contentTypes, maxBytes, timeout = 20000, url } = request;

  if (!isHttps(url)) {
    throw createCopyError({
      code: 'url_not_https',
      message: 'AwsS3PutObject "url" must be an https: link.',
    });
  }

  const signal = AbortSignal.timeout(timeout);
  let refusal = null;
  try {
    const response = await fetchUrl({ url, signal });
    if (!response.ok) {
      await response.body?.cancel();
      throw createCopyError({
        code: 'fetch_failed',
        message: `AwsS3PutObject url answered ${response.status}.`,
        status: response.status,
      });
    }

    const responseType = response.headers.get('content-type');
    const mediaType = responseType?.split(';')[0].trim().toLowerCase() ?? null;
    if (
      !type.isNone(contentTypes) &&
      (mediaType === null ||
        !contentTypes.some((pattern) => matchesContentType({ pattern, mediaType })))
    ) {
      await response.body?.cancel();
      throw createCopyError({
        code: 'content_type',
        message: `AwsS3PutObject url content type ${JSON.stringify(
          mediaType
        )} is not one of ${contentTypes.join(', ')}.`,
      });
    }

    const lengthHeader = response.headers.get('content-length');
    const declaredLength = lengthHeader === null ? null : Number(lengthHeader);
    if (declaredLength !== null && declaredLength > maxBytes) {
      await response.body?.cancel();
      throw createCopyError({
        code: 'too_large',
        message: `AwsS3PutObject url content of ${declaredLength} bytes is larger than maxBytes (${maxBytes}).`,
      });
    }

    const chunks = limitBody({
      body: response.body ?? [],
      declaredLength,
      maxBytes,
      onRefuse: (error) => {
        refusal = error;
      },
    });
    let size;
    if (declaredLength === null) {
      params.Body = await collect(chunks);
      size = params.Body.length;
    } else {
      params.Body = Readable.from(chunks, { objectMode: false });
      params.ContentLength = declaredLength;
      size = declaredLength;
    }
    const storedType = contentType ?? responseType ?? null;
    if (!type.isNone(storedType)) {
      params.ContentType = storedType;
    }
    await s3.send(new PutObjectCommand(params), { abortSignal: signal });
    return { bucket: params.Bucket, key: params.Key, size, contentType: storedType };
  } catch (error) {
    if (refusal !== null) throw refusal;
    if (signal.aborted) {
      throw createCopyError({
        code: 'timeout',
        message: `AwsS3PutObject did not copy the url within the ${timeout} ms timeout.`,
        cause: error,
      });
    }
    throw error;
  }
}

export default copyFromUrl;
