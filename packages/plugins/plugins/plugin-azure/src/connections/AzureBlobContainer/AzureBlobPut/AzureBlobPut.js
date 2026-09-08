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

import schema from './schema.js';

// Server-side write: stores base64 content as a block blob. Used by API
// endpoint routines that receive files as endpoint payloads
// (emitFileContent + CallAPI).
async function AzureBlobPut({ request, connection }) {
  const { account, accountKey, container } = connection;
  const { content, contentType, key } = request;
  const credential = new StorageSharedKeyCredential(account, accountKey);
  const serviceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential
  );
  const blockBlobClient = serviceClient.getContainerClient(container).getBlockBlobClient(key);
  const buffer = Buffer.from(content, 'base64');
  const options = {};
  if (contentType) {
    options.blobHTTPHeaders = { blobContentType: contentType };
  }
  await blockBlobClient.upload(buffer, buffer.length, options);
  return { bucket: container, key };
}

AzureBlobPut.schema = schema;
AzureBlobPut.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AzureBlobPut;
