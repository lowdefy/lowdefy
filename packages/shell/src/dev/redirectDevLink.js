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

import parseDevLink from './connection/parseDevLink.js';
import getShellConfig from '../config/getShellConfig.js';

// Expo Router's redirectSystemPath (app/+native-intent.js): a Lowdefy Dev link is DevShell's, not a
// page path. Opened with one, the app starts on its home screen; while it runs, the router leaves
// it alone.
function redirectDevLink({ initial, path }) {
  if (parseDevLink({ link: path, scheme: getShellConfig().scheme }) === null) {
    return path;
  }
  return initial ? '/' : null;
}

export default redirectDevLink;
