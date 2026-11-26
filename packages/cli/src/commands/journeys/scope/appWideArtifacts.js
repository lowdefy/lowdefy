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

// The app-wide artifacts of a build, which can affect any page: the scope diff
// compares them (readBuildArtifacts) and hashBuild hashes them, beside each
// page, request, endpoint, connection and websocket.
const APP_WIDE_ARTIFACTS = [
  'events.json',
  'menus.json',
  'global.json',
  'app.json',
  'config.json',
  'i18n.json',
  'theme.json',
  'auth.json',
  'dynamicPolicies.json',
  'tenantTargets.json',
];

export default APP_WIDE_ARTIFACTS;
