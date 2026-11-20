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
import { parseDataSet } from '@lowdefy/node-utils';

import createCallerGate from './createCallerGate.js';
import getEndpointOutcome from './getEndpointOutcome.js';
import readAccessConfig from './readAccessConfig.js';
import signedOutCaller from './signedOutCaller.js';
import sortByKey from './sortByKey.js';

// Who can reach which page and endpoint: the outcome of the authorization gate (allow, deny or
// enrol_required) for every page route and every endpoint in the build, as each user of the
// data set and as a signed out caller ("none"). It asks the gate the page and endpoint routes
// ask, in process, so it needs no server, database or data session. Keys are sorted, so the
// table is the same on every run and fits a committed snapshot.
async function accessMatrix({ testApp, data }) {
  if (testApp.closed) {
    throw new Error('The test app is closed. Open one with openTestApp.');
  }
  if (!type.isString(data)) {
    throw new Error(
      `accessMatrix requires "data", the name of a data set in tests/data whose users to check. Received ${JSON.stringify(
        data
      )}.`
    );
  }
  const { users } = await parseDataSet({ configDirectory: testApp.directories.config, name: data });
  const callers = sortByKey([[signedOutCaller, null], ...Object.entries(users)]).map(
    ([name, user]) => ({ name, authorizeOutcome: createCallerGate({ testApp, user }) })
  );
  const { pages, endpoints } = readAccessConfig({ testApp });

  return {
    pages: Object.fromEntries(
      sortByKey(
        pages.map((page) => [
          page.pageId,
          Object.fromEntries(
            callers.map(({ name, authorizeOutcome }) => [
              name,
              authorizeOutcome(page, { pageId: page.pageId }),
            ])
          ),
        ])
      )
    ),
    endpoints: Object.fromEntries(
      sortByKey(
        endpoints.map((endpoint) => [
          endpoint.endpointId,
          Object.fromEntries(
            callers.map(({ name, authorizeOutcome }) => [
              name,
              getEndpointOutcome({ authorizeOutcome, endpoint }),
            ])
          ),
        ])
      )
    ),
  };
}

export default accessMatrix;
