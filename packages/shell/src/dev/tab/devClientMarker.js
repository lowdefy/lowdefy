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

// Sent with every connection the dev-tab client opens, so the dev server knows a shell's tab from a
// browser's, and so a release bundle that holds it fails scripts/checkReleaseBundle.mjs. Keep it in
// step with shellVariant.js.
const DEV_CLIENT_MARKER = 'lowdefy-dev-tab-client';

export default DEV_CLIENT_MARKER;
