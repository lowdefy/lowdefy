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

import checkAccessTable from './checkAccessTable.js';
import updateAccessTable from './updateAccessTable.js';

// The access step of a `lowdefy test` run that reads the production build, on the run's one app
// (openBuildApp, which checks the build). mode is "check" (--build), "access"
// (--access, where a missing file fails) or "update" (--update-access). Returns { failed }.
async function runAccessStep({ app, context, mode }) {
  if (mode === 'update') {
    return updateAccessTable({ app, context });
  }
  return checkAccessTable({ app, context, required: mode === 'access' });
}

export default runAccessStep;
