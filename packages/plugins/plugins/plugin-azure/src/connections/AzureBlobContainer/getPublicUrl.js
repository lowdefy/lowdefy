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

import getBlobUrl from './getBlobUrl.js';

// Stable, non-expiring URL for a publicly readable blob. Public is
// author-declared, never runtime-checked — a public URL to a private blob 403s.
function getPublicUrl({ connection, key }) {
  const { publicUrlBase } = connection;
  if (!type.isNone(publicUrlBase)) {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${publicUrlBase.replace(/\/+$/, '')}/${encodedKey}`;
  }
  return getBlobUrl({ connection, key });
}

export default getPublicUrl;
