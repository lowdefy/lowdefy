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

/**
 * How a generated report is named on its way to the browser.
 *
 * One definition for both servers: the percent-encoding below is the kind of
 * detail that, duplicated, ends up subtly different in dev and prod — and a
 * download name that breaks in only one of them is the last thing anyone thinks
 * to check.
 */

// Characters that would break out of the quoted header value or name a path
// rather than a file: quotes, backslashes, separators, and control bytes.
// Stripping control bytes is the point here, hence the rule exemption.
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /["\\/\x00-\x1f\x7f]/g;

// RFC 5987 attr-char excludes these four, and `encodeURIComponent` leaves them
// alone, so they need encoding by hand.
const NOT_ATTR_CHAR = /['()*!]/g;

const percentEncode = (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`;

/** A requested download name reduced to something safe to put in a header. */
export function sanitizeReportFilename(name) {
  return typeof name === 'string' ? name.replace(UNSAFE_FILENAME_CHARS, '').trim() : '';
}

/**
 * The `Content-Disposition` value for a report download.
 *
 * Two spellings of one name. A header value is latin1, so a non-ASCII name
 * written into the quoted `filename` arrives mangled — `Rapport Août.pdf`
 * downloads as `Rapport Aoï¿½t.pdf`. RFC 6266's `filename*` carries the real
 * name as percent-encoded UTF-8 and wins wherever it is understood; the quoted
 * form stays as the fallback for whatever does not read it. Both are always
 * emitted, so an accented name and a plain one travel the same path.
 *
 * @param {object} params
 * @param {string} [params.requested] The caller's name (a `DownloadReport` param).
 * @param {string} [params.fallback] The generated name, used when the requested
 *   one is absent or sanitizes away to nothing.
 * @returns {string}
 */
export function reportContentDisposition({ requested, fallback } = {}) {
  const name = sanitizeReportFilename(requested) || sanitizeReportFilename(fallback) || 'report';
  // eslint-disable-next-line no-control-regex
  const ascii = name.replace(/[^\x20-\x7e]/g, '_');
  const encoded = encodeURIComponent(name).replace(NOT_ATTR_CHAR, percentEncode);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
