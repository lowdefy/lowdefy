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

// Save a base64 file envelope — `{ name, size, type, content }`, as produced by
// RenderReport — to the browser as a download. Named for the envelope, not for
// reports, because the envelope is the platform's shape (it matches
// AwsS3GetObject): any request returning one can be handed straight here.
// Follows DownloadCsv: build a Blob, object-URL it, click a synthetic anchor.
function DownloadFile({ params }) {
  const { content, name, type } = params ?? {};
  if (typeof content !== 'string') {
    throw new Error('DownloadFile requires a base64 "content" string.');
  }
  if (typeof name !== 'string' || name === '') {
    throw new Error('DownloadFile requires a "name" string.');
  }

  // Decode the base64 content into bytes for the Blob — the envelope carries
  // text so it survives JSON transport; the download needs the raw file.
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: type ?? 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.setAttribute('download', name);
  el.click();
  // Revoke on the next tick, not synchronously: Safari cancels a download whose
  // object URL is revoked in the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default DownloadFile;
