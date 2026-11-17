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

import { buildPagePath, serializer } from '@lowdefy/helpers';
import { addJourneyStubs } from '@lowdefy/test-utils/dataSets';
import { headlessCalls } from '@lowdefy/test-utils/headless';

import createErrorSink from './createErrorSink.js';
import createHeadlessHost from './createHeadlessHost.js';
import loadClientPlugins from './loadClientPlugins.js';

const NOT_FOUND_PATH = '404';

// A headless host for one journey on a production build that @lowdefy/test-utils' openTestApp
// opened: a session is opened on data set `data` (or none), so requests and endpoint calls run in
// process on a fresh copy of it on the run's data store. `user` is who the page is opened as by
// default: a user of the data set by name, a user object, or "none". `stubs` are the journey's
// own (answer stubs and fail gates), set on the session before any call. The app is opened once and
// serves every journey of a run (openTestApp checks the build and takes the app's secrets out of
// the environment); the host's close() ends only its session, and the app's close() ends the app.
async function createBuildHost({ app, data, stubs, user }) {
  const session = await app.openSession({ data });
  const calls = headlessCalls(session);
  addJourneyStubs({ session: calls.dataSession, stubs });
  let rootConfig;
  // The caller closes only a host it got back, so a session whose root config is refused (an
  // unknown user) is closed here.
  try {
    rootConfig = await calls.readRootConfig({ user });
  } catch (error) {
    await calls.close();
    throw error;
  }
  let clientPlugins = null;

  async function readPageConfig({ pageId, path, pathParams, urlQuery, user: pageUser }) {
    const matchedPath =
      path ?? buildPagePath({ pageId, path: rootConfig.pagePaths?.[pageId], pathParams });
    const page = await calls.readPage({ path: matchedPath, urlQuery, user: pageUser ?? user });
    // The page route sends a page that does not exist, and one the caller may not open, to the
    // not-found page, so neither reveals which it was.
    if (['not_found', 'unauthorized'].includes(page.status) && matchedPath !== NOT_FOUND_PATH) {
      return readPageConfig({ path: NOT_FOUND_PATH, urlQuery: {}, user: pageUser });
    }
    if (page.status !== 'ok') {
      throw new Error(
        `Page "${pageId ?? matchedPath}" did not open: the page route answered "${page.status}".`
      );
    }
    return {
      matchedPath,
      pageConfig: page.pageConfig,
      pageId: page.pageId,
      pathParams: page.pathParams,
    };
  }

  function readArtifact(name) {
    const filePath = path.join(calls.buildDirectory, name);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return serializer.deserialize(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  }

  return createHeadlessHost({
    call: ({ actionId, blockId, endpointId, kind, pageId, payload, requestId, user: caller }) =>
      calls.call({
        body: kind === 'request' ? { actionId, blockId, payload } : { blockId, pageId, payload },
        endpointId,
        kind,
        pageId,
        requestId,
        user: caller ?? user,
      }),
    close: () => calls.close(),
    dataSetName: calls.dataSetName,
    dataSession: calls.dataSession,
    errorSink: createErrorSink(),
    findDocuments: calls.findDocuments,
    loadClientPlugins: () => {
      clientPlugins = clientPlugins ?? loadClientPlugins({ buildDirectory: calls.buildDirectory });
      return clientPlugins;
    },
    readArtifact,
    readPageConfig,
    resolveUser: (pageUser) => calls.resolveUser(pageUser ?? user),
    rootConfig,
    system: ({ endpointId, payload }) => calls.system({ endpointId, payload }),
    userNames: calls.userNames,
    webhook: ({ endpointId, headers, query, rawBody }) =>
      calls.webhook({ endpointId, headers, query, rawBody }),
  });
}

export default createBuildHost;
