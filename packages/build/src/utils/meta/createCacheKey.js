/*
  Copyright 2020 Lowdefy, Inc

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

function createCacheKey(location) {
  if (type.isNone(location)) {
    throw new Error('Failed to create cache key, location is undefined.');
  }
  if (!type.isString(location.url)) {
    throw new Error('Location url definition should be a string.');
  }
  return (
    location.url
      // Replace all non alphanumeric characters (or _ - ) with a _
      .replace(/~/g, '_tilde_')
      .replace(/\^/g, '_caret_')
      .replace(/\*/g, '_star_')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .toLowerCase()
      // Replace _json at end of the file with .json
      .replace(/_json$/, '.json')
  );
}

export default createCacheKey;
