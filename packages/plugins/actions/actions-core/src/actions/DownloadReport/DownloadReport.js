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

// The route writes both spellings of the name (RFC 6266): a quoted ASCII
// `filename` and a `filename*` carrying the real one as percent-encoded UTF-8.
// Prefer the encoded one — the quoted fallback has had every non-ASCII character
// replaced, so reading it would save `Rapport Août.pdf` as `Rapport Ao_t.pdf`.
function filenameFromHeaders(headers) {
  const disposition = headers?.get?.('content-disposition') ?? '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // A malformed escape — fall through to the quoted name.
    }
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1];
}

async function DownloadReport({ globals, methods, params = {} }) {
  const { basePath = '', document, fetch, window } = globals;
  const { format = 'pdf' } = params;
  const currentPageId = methods.getPageId();
  const pageId = params.pageId ?? currentPageId;

  // WYSIWYG: with no overrides the report renders from the live page context, so
  // the file matches what the user is looking at. A cross-page report has no
  // live context to snapshot — only explicit params are sent there.
  const snapshot =
    pageId === currentPageId
      ? {
          urlQuery: methods.getUrlQuery({ all: true }),
          input: methods.getInput({ all: true }),
          state: methods.getState({ all: true }),
        }
      : {};

  const response = await fetch(`${basePath}/api/report/${pageId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    // JSON.stringify drops the undefined keys, so the route falls back to its
    // own defaults for anything neither passed nor snapshotted.
    body: JSON.stringify({
      format,
      filename: params.filename,
      urlQuery: params.urlQuery ?? snapshot.urlQuery,
      input: params.input ?? snapshot.input,
      state: params.state ?? snapshot.state,
    }),
  });

  if (!response.ok) {
    // The route answers errors with a plain-text body ('Not found', 'Report
    // generation timed out', a ConfigError message). Throwing it lets the
    // event's error message and catchActions behave like any other action.
    const message = await response.text().catch(() => '');
    throw new Error(message || `Report request failed with status ${response.status}.`);
  }

  const contentType = response.headers?.get?.('content-type') ?? 'application/octet-stream';
  const filename =
    params.filename ??
    filenameFromHeaders(response.headers) ??
    `${pageId.split('/').pop()}.${format}`;

  const blob = new Blob([await response.arrayBuffer()], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.setAttribute('download', filename);
  el.click();
  // An object URL pins its blob until it is revoked, and a report is megabytes —
  // a dashboard the user downloads from a few times would hold every copy for
  // the life of the page. The browser reads the blob after the click returns, so
  // the URL has to outlive this call: revoke on a later task, not now.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  return;
}

export default DownloadReport;
