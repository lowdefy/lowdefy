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
 * The typed failures of the generation guardrails.
 *
 * A report route maps a failure to an HTTP status, and it must do that by class.
 * Matching on message text — the first attempt — was wrong in both directions:
 * `/timed out/` turned any upstream timeout (a slow database, a slow API) into a
 * 504 blaming report generation, and an unsupported `format` matched nothing at
 * all and surfaced as a 500 even though it is purely the caller's mistake.
 *
 * The caller's config mistakes stay `ConfigError` from `@lowdefy/errors` (an
 * unsupported format, xlsx for a page with no grids) and map to 400. These two
 * cover the operational limits.
 */

/** The generation exceeded its timeout and was aborted. Maps to 504. */
export class ReportTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReportTimeoutError';
  }
}

/** Too many generations are running and queued; the caller should retry. Maps to 503. */
export class ReportBusyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReportBusyError';
  }
}
