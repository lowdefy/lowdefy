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
 * Shared helpers for the blocks-basic `./static` report renderers.
 *
 * Renderers emit plain report-IR object literals — never pdfmake or ExcelJS
 * objects, and never a constructor imported from `@lowdefy/reports`. Keeping
 * the block package free of the reports dependency is deliberate: only
 * `@lowdefy/reports` carries pdfmake/ExcelJS. The IR shape is a stable,
 * versioned contract, and the walker validates every returned node, so a typo
 * surfaces as a ConfigError in dev.
 */

import { type } from '@lowdefy/helpers';

/** True when a value would render nothing (null, undefined, or empty string). */
export function isBlank(value) {
  return type.isNone(value) || value === '';
}
