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
import getPublicUrl from '../getPublicUrl.js';
import schema from './schema.js';

async function AzureBlobDownloadSas({ request, connection }) {
  const { account, accountKey, container } = connection;
  const { contentDisposition, contentType, expires = 3600, key } = request;
  if (request.public === true) {
    return getPublicUrl({ connection, key });
  }
  const credential = new StorageSharedKeyCredential(account, accountKey);
  const options = {
    containerName: container,
    blobName: key,
    permissions: BlobSASPermissions.parse('r'),
    expiresOn: new Date(Date.now() + expires * 1000),
  };
  if (contentDisposition) {
    options.contentDisposition = contentDisposition;
  }
  if (contentType) {
    options.contentType = contentType;
  }
  const sas = generateBlobSASQueryParameters(options, credential).toString();
  return `${getBlobUrl({ connection, key })}?${sas}`;
}

AzureBlobDownloadSas.schema = schema;
AzureBlobDownloadSas.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AzureBlobDownloadSas;
