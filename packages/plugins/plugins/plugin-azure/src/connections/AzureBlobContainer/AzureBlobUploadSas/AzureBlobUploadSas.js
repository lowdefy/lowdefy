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

import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

import getBlobUrl from '../getBlobUrl.js';
import schema from './schema.js';

async function AzureBlobUploadSas({ request, connection }) {
  const { account, accountKey, container } = connection;
  const { contentType, expires = 3600, key } = request;
  const credential = new StorageSharedKeyCredential(account, accountKey);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName: key,
      permissions: BlobSASPermissions.parse('cw'),
      expiresOn: new Date(Date.now() + expires * 1000),
    },
    credential
  ).toString();
  const headers = { 'x-ms-blob-type': 'BlockBlob' };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  // PUT descriptor: the signed url already targets the blob, the client sends
  // the file as the raw request body with these headers. Object identity is
  // carried at the descriptor top level (there is no fields object on PUT).
  return {
    method: 'PUT',
    url: `${getBlobUrl({ connection, key })}?${sas}`,
    bucket: container,
    key,
    headers,
  };
}

AzureBlobUploadSas.schema = schema;
AzureBlobUploadSas.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AzureBlobUploadSas;
