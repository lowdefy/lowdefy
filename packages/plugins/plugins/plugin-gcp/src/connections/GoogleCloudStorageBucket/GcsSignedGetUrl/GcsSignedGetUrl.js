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
import getPublicUrl from '../getPublicUrl.js';
import schema from './schema.js';

async function GcsSignedGetUrl({ request, connection }) {
  const { expires = 3600, key, responseDisposition, responseType } = request;
  if (request.public === true) {
    return getPublicUrl({ connection, key });
  }
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + expires * 1000,
  };
  if (responseDisposition) {
    options.responseDisposition = responseDisposition;
  }
  if (responseType) {
    options.responseType = responseType;
  }
  const file = getBucket({ connection }).file(key);
  const [url] = await file.getSignedUrl(options);
  return url;
}

GcsSignedGetUrl.schema = schema;
GcsSignedGetUrl.meta = {
  checkRead: true,
  checkWrite: false,
};

export default GcsSignedGetUrl;
