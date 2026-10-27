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

import http from 'node:http';

import { Readable } from 'node:stream';

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import createS3Client from './createS3Client.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

// The real AWS SDK against a local S3-compatible endpoint: the SDK parses S3's XML
// responses itself, so a client upgrade is checked here rather than in the mocked
// request tests.
let server;
let endpoint;
let putBodyLength;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.method === 'PUT') {
      let length = 0;
      req.on('data', (data) => {
        length += data.length;
      });
      req.on('end', () => {
        putBodyLength = length;
        res.writeHead(200, { etag: '"put123"' });
        res.end();
      });
      return;
    }
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'content-length': '11',
        'content-type': 'text/plain',
        etag: '"abc123"',
        'last-modified': 'Wed, 01 Jan 2025 00:00:00 GMT',
      });
      res.end();
      return;
    }
    res.writeHead(404, { 'content-type': 'application/xml' });
    res.end(
      '<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message><Key>missing.txt</Key></Error>'
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  endpoint = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

function client() {
  return createS3Client({
    connection: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
    },
  });
}

test('createS3Client reads object metadata from an S3-compatible endpoint', async () => {
  const response = await client().send(
    new HeadObjectCommand({ Bucket: 'bucket', Key: 'file.txt' })
  );
  expect(response.ContentLength).toBe(11);
  expect(response.ETag).toBe('"abc123"');
  expect(response.LastModified).toEqual(new Date('2025-01-01T00:00:00Z'));
});

test('createS3Client parses an S3 XML error into a named SDK error', async () => {
  const error = await client()
    .send(new GetObjectCommand({ Bucket: 'bucket', Key: 'missing.txt' }))
    .catch((e) => e);
  expect(error.name).toBe('NoSuchKey');
  expect(error.message).toBe('The specified key does not exist.');
  expect(error.$metadata.httpStatusCode).toBe(404);
});

test('createS3Client sets requestStreamBufferSize so the SDK buffers streamed uploads', async () => {
  // The SDK only buffers a streamed body into aws-chunked frames when this is at least 8192;
  // below that, a body arriving in small chunks fails with InvalidChunkSizeError.
  expect(await client().config.requestStreamBufferSize).toBe(65536);
});

test('createS3Client uploads a streamed body that arrives in small chunks', async () => {
  const chunk = Buffer.alloc(1000, 'a');
  const chunks = Array.from({ length: 300 }, () => chunk);
  const response = await client().send(
    new PutObjectCommand({
      Bucket: 'bucket',
      Key: 'file.png',
      Body: Readable.from(chunks, { objectMode: false }),
      ContentLength: 300000,
    })
  );
  expect(response.ETag).toBe('"put123"');
  expect(putBodyLength).toBeGreaterThan(300000);
});
