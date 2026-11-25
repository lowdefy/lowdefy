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

import fs from 'node:fs';
import path from 'node:path';

import listEndpointFiles from './listEndpointFiles.js';
import readBuildJson from './readBuildJson.js';

// The gate reads an endpoint's id, type and auth (and its config key for an error), so only those
// are deserialized: the routine, most of an endpoint's file, is parsed as plain JSON and dropped.
function readEndpointAccess({ directories, filePath, serializer }) {
  const endpoint = JSON.parse(fs.readFileSync(path.join(directories.build, filePath), 'utf8'));
  return serializer.deserialize({
    '~k': endpoint['~k'],
    auth: endpoint.auth,
    endpointId: endpoint.endpointId,
    type: endpoint.type,
  });
}

// What the gate is asked about: every page route and every endpoint in the build. A page's auth
// is read from routes.json, the artifact the page route matches a path on, so no page file is
// opened. Read once per app, since a build does not change while a test app is open.
function readAccessConfig({ testApp }) {
  if (testApp.accessConfig === null) {
    const { directories } = testApp;
    const { serializer } = testApp.modules.helpers;
    testApp.accessConfig = {
      pages: readBuildJson({ directories, filePath: 'routes.json', serializer }),
      endpoints: listEndpointFiles({ directories }).map((filePath) =>
        readEndpointAccess({ directories, filePath, serializer })
      ),
    };
  }
  return testApp.accessConfig;
}

export default readAccessConfig;
