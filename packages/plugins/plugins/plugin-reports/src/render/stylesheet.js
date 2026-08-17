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

// The build's compiled report stylesheet, emitted by `writeReportStyles` at
// `build/reports/styles.css` when the plugin is installed. readConfigFile admits
// the path under its charset guard and returns raw text for a non-.json
// extension, memoised through fileCache — so consuming it needs no new plumbing.
// An app whose build produced no stylesheet (the step is gated on the plugin)
// resolves to undefined and renders without one.
const STYLESHEET_PATH = 'reports/styles.css';

async function getReportStylesheet({ readConfigFile }) {
  const stylesheet = await readConfigFile(STYLESHEET_PATH);
  return type.isNone(stylesheet) ? undefined : stylesheet;
}

export default getReportStylesheet;
