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

import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../../../..');

// The apps in this repository the suites read a production build of. The global setup builds
// each one into its own server copy under _server/, which scripts/build.mjs fills as it does
// _server/prod, so a developer's own _server/prod and _server/dev are left alone.
//   journey-fixture        every page public, one endpoint gated to a role
//   auth-reference-tenant  pages protected by default, one page gated to a role
//   auth-reference         a second factor required, with an enrolment page
function fixtureApp(name) {
  return {
    name,
    configDirectory: path.join(repositoryRoot, 'apps', name),
    serverDirectory: path.join(repositoryRoot, '_server', `test-utils-${name}`),
  };
}

const fixtureApps = {
  journeyFixture: fixtureApp('journey-fixture'),
  authReferenceTenant: fixtureApp('auth-reference-tenant'),
  authReference: fixtureApp('auth-reference'),
};

export { repositoryRoot };
export default fixtureApps;
