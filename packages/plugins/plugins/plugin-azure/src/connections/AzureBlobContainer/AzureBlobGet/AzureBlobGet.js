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

import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { type } from '@lowdefy/helpers';

import schema from './schema.js';

// Server-side read: returns the blob content as a base64 string so routine
// steps can process it with operators and pass it to other steps (base64
// survives JSON serialization; consumers decode with Buffer.from(content, 'base64')).
async function AzureBlobGet({ request, connection }) {
  const { account, accountKey, container } = connection;
  const { key } = request;
  const credential = new StorageSharedKeyCredential(account, accountKey);
  const serviceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential
  );
  const blobClient = serviceClient.getContainerClient(container).getBlockBlobClient(key);
  // Properties are only used for contentType — size is derived from the returned
  // content so it always matches, even if the blob is overwritten between calls.
  const [buffer, properties] = await Promise.all([
    blobClient.downloadToBuffer(),
    blobClient.getProperties(),
  ]);
  const result = {
    bucket: container,
    key,
    content: buffer.toString('base64'),
    size: buffer.length,
  };
  if (!type.isNone(properties.contentType)) {
    result.contentType = properties.contentType;
  }
  return result;
}

AzureBlobGet.schema = schema;
AzureBlobGet.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AzureBlobGet;
