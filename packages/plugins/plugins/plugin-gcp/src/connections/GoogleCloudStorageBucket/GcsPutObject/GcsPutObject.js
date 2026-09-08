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

import getBucket from '../getBucket.js';
import schema from './schema.js';

// Server-side write: stores base64 content as an object. Used by API endpoint
// routines that receive files as endpoint payloads (emitFileContent + CallAPI).
async function GcsPutObject({ request, connection }) {
  const { bucket } = connection;
  const { content, contentType, key } = request;
  const options = { resumable: false };
  if (contentType) {
    options.contentType = contentType;
  }
  if (request.public === true) {
    options.public = true;
  }
  const file = getBucket({ connection }).file(key);
  await file.save(Buffer.from(content, 'base64'), options);
  return { bucket, key };
}

GcsPutObject.schema = schema;
GcsPutObject.meta = {
  checkRead: false,
  checkWrite: true,
};

export default GcsPutObject;
