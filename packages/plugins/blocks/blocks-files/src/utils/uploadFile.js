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

// Uploads a file to the target described by an upload-policy descriptor:
// { method, url, key, bucket, fields | headers }.
// - method 'POST' (default): multipart form upload — append the policy fields,
//   then the file (S3, R2, MinIO, GCS POST policy).
// - method 'PUT': the signed url already targets the object — set headers and
//   send the file as the raw request body (Azure SAS, presigned PUT).
// Object identity (key/bucket) is read from the descriptor top level by
// callers, never from fields — the PUT branch has no fields object.
function uploadFile({ descriptor, file, onProgress = () => null }) {
  const { method = 'POST', url, fields = {}, headers = {} } = descriptor;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = async (event) => {
      if (event.lengthComputable) {
        await onProgress(event);
      }
    };
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`File upload failed with status ${xhr.status}.`));
      }
    });
    xhr.addEventListener('error', () => {
      reject(
        new ServiceError(
          `File upload failed for "${file.name}" — CORS or network error. ` +
            `Check that the storage bucket CORS configuration allows requests from this origin.`,
          { service: 'FileStorage' }
        )
      );
    });
    xhr.addEventListener('abort', () => {
      reject(new Error(`File upload aborted for "${file.name}".`));
    });
    if (method.toUpperCase() === 'PUT') {
      xhr.open('put', url);
      Object.keys(headers).forEach((header) => {
        xhr.setRequestHeader(header, headers[header]);
      });
      xhr.send(file);
    } else {
      const formData = new FormData();
      Object.keys(fields).forEach((field) => {
        formData.append(field, fields[field]);
      });
      formData.append('file', file);
      xhr.open('post', url);
      xhr.send(formData);
    }
  });
}

export default uploadFile;
