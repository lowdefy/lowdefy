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

import { validate } from '@lowdefy/ajv';

import AwsS3PutObject from './AwsS3PutObject.js';

const mockSend = jest.fn();
const mockS3ClientConstructor = jest.fn();
const mockPutObjectCommand = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return { send: mockSend };
  }),
  PutObjectCommand: jest.fn().mockImplementation((params) => {
    mockPutObjectCommand(params);
    return { __command: 'PutObjectCommand', params };
  }),
}));

const schema = AwsS3PutObject.schema;
const { checkRead, checkWrite } = AwsS3PutObject.meta;

beforeEach(() => {
  mockSend.mockReset();
  mockS3ClientConstructor.mockReset();
  mockPutObjectCommand.mockReset();
  mockSend.mockResolvedValue({ ETag: '"abc123"', VersionId: 'v1' });
});

const baseConnection = {
  accessKeyId: 'KEY',
  secretAccessKey: 'SECRET',
  region: 'eu-west-1',
  bucket: 'my-bucket',
};

test('AwsS3PutObject meta exposes write-only access', () => {
  expect(checkRead).toBe(false);
  expect(checkWrite).toBe(true);
});

test('AwsS3PutObject calls S3 putObject with required params', async () => {
  const result = await AwsS3PutObject({
    request: { key: 'audit/2026-05-03/evt_x.json', body: '{"a":1}' },
    connection: baseConnection,
  });
  expect(mockS3ClientConstructor).toHaveBeenCalledWith({
    credentials: { accessKeyId: 'KEY', secretAccessKey: 'SECRET' },
    region: 'eu-west-1',
  });
  expect(mockPutObjectCommand).toHaveBeenCalledWith(
    expect.objectContaining({
      Bucket: 'my-bucket',
      Key: 'audit/2026-05-03/evt_x.json',
      Body: '{"a":1}',
      ContentType: 'application/octet-stream',
    })
  );
  expect(result).toEqual({
    bucket: 'my-bucket',
    key: 'audit/2026-05-03/evt_x.json',
    etag: '"abc123"',
    versionId: 'v1',
  });
});

test('AwsS3PutObject uses provided contentType and acl/metadata when given', async () => {
  await AwsS3PutObject({
    request: {
      key: 'k',
      body: 'b',
      contentType: 'application/json',
      acl: 'private',
      metadata: { source: 'audit' },
    },
    connection: baseConnection,
  });
  expect(mockPutObjectCommand).toHaveBeenCalledWith(
    expect.objectContaining({
      ContentType: 'application/json',
      ACL: 'private',
      Metadata: { source: 'audit' },
    })
  );
});

test('AwsS3PutObject schema requires key and body', () => {
  expect(() =>
    validate({ schema, data: { key: 'k' } })
  ).toThrow();
  expect(() =>
    validate({ schema, data: { body: 'b' } })
  ).toThrow();
  expect(validate({ schema, data: { key: 'k', body: 'b' } }).valid).toBe(true);
});

test('AwsS3PutObject surfaces SDK errors', async () => {
  mockSend.mockRejectedValueOnce(new Error('AccessDenied'));
  await expect(
    AwsS3PutObject({ request: { key: 'k', body: 'b' }, connection: baseConnection })
  ).rejects.toThrow('AccessDenied');
});
