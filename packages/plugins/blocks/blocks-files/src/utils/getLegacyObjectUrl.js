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

// Legacy unsigned object URL derived from an upload descriptor. Only renders
// for publicly readable objects and bakes in provider URL shapes — kept as a
// backwards-compatible fallback for callers that have no download request
// configured. New configs should resolve URLs through a download request
// (with public: true for stable public URLs) instead.
function getLegacyObjectUrl({ descriptor }) {
  const { method = 'POST', url, key } = descriptor;
  if (method.toUpperCase() === 'PUT') {
    // The signed PUT url already targets the object — strip the signature.
    return url.split('?')[0];
  }
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  // createPresignedPost returns the bucket endpoint with a trailing slash, so only
  // add a separator when it is missing to avoid a double slash before the key.
  return url.endsWith('/') ? `${url}${encodedKey}` : `${url}/${encodedKey}`;
}

export default getLegacyObjectUrl;
