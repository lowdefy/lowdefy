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

import { type } from '@lowdefy/helpers';

import getBucket from '../getBucket.js';
import schema from './schema.js';

// Server-side read: returns the object content as a base64 string so routine
// steps can process it with operators and pass it to other steps (base64
// survives JSON serialization; consumers decode with Buffer.from(content, 'base64')).
async function GcsGetObject({ request, connection }) {
  const { bucket } = connection;
  const { key } = request;
  const file = getBucket({ connection }).file(key);
  // Metadata is only used for contentType — size is derived from the returned
  // content so it always matches, even if the object is overwritten between calls.
  const [[content], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
  const result = {
    bucket,
    key,
    content: content.toString('base64'),
    size: content.length,
  };
  if (!type.isNone(metadata.contentType)) {
    result.contentType = metadata.contentType;
  }
  return result;
}

GcsGetObject.schema = schema;
GcsGetObject.meta = {
  checkRead: true,
  checkWrite: false,
};

export default GcsGetObject;
