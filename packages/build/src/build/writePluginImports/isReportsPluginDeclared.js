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

// The reports build artifacts (blocksStatic.js, reports/styles.css) exist only
// to serve @lowdefy/plugin-reports. Installing the plugin is the usage signal
// that gates both — an app that never declares it pays nothing.
export const REPORTS_PLUGIN_NAME = '@lowdefy/plugin-reports';

function isReportsPluginDeclared({ context }) {
  return (context.plugins ?? []).some((plugin) => plugin?.name === REPORTS_PLUGIN_NAME);
}

export default isReportsPluginDeclared;
