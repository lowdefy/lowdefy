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

/**
 * What a headless page runs on: the build, the server and the data, given by a host so the
 * runner never imports from a server. Two hosts give it: a production build through
 * @lowdefy/test-utils (createBuildHost), and the dev server (to come).
 *
 * @typedef {Object} HeadlessHost
 * @property {Object} rootConfig The root config the page route sends with every page, as JSON,
 *   for the host's user: home, menus, pagePaths, app events, global, theme, i18n.
 * @property {(args: { pageId?: string, path?: string, pathParams?: Object, urlQuery?: Object,
 *   user?: * }) => Promise<{ pageConfig: Object, pageId: string, pathParams: Object,
 *   matchedPath: string }>} readPageConfig The page's config as the page route sends it (JSON,
 *   serialized form) to the user, which defaults to the host's: by pageId and pathParams, or by
 *   path (no leading "/"), as a followed link names it. Throws when the user may not open it.
 * @property {() => Promise<ClientPlugins>} loadClientPlugins The client plugins the build wrote:
 *   { actions, operators, jsMap, blockMetas }. No block components.
 * @property {(args: HostCall) => Promise<HostAnswer>} call Runs a page request or an endpoint as
 *   the server does, in process.
 * @property {Object} dataSession The data the calls run on: a test-utils session
 *   (collection, settled, reset).
 * @property {string|null} dataSetName The data set the data was loaded from, or null for none.
 * @property {(name: string) => (Object|null)} readArtifact A build artifact by its path in the
 *   build ("routes.json", "pages/home.json", "api/notify.json"), deserialized, or null when the
 *   build has none: what the runner checks a step's ids against.
 * @property {(args: { collection: string, connectionId?: string, match: Object }) =>
 *   Promise<Object[]>} findDocuments The documents `match` finds in a collection of the data's
 *   database (the connection's, or the only one), in _id order, as JSON values, for expect.db.
 * @property {ErrorSink} errorSink Where the server's faults and the client's errors go, for the
 *   run's invariants.
 * @property {(user?: *) => (Object|null)} resolveUser The user object a page renders for a user
 *   as calls take one, the host's user by default; null for a signed-out caller.
 * @property {string[]} userNames The data set's users by name, whom an `as` step can switch to.
 * @property {() => Promise<void>} close Releases what the host holds.
 */

/**
 * @typedef {Object} HostCall
 * @property {'request'|'endpoint'} kind
 * @property {string} [pageId] The page a request belongs to, or the page an endpoint is called
 *   from.
 * @property {string} [requestId]
 * @property {string} [endpointId]
 * @property {string} [blockId] The block whose event made the call.
 * @property {string} [actionId] The action that made a request.
 * @property {*} payload The payload as the client posts it, serialized by the engine.
 * @property {*} [user] Who calls: a data set user name, a user object or "none". Defaults to the
 *   host's user.
 */

/**
 * @typedef {Object} HostAnswer As test-utils' answerCall answers.
 * @property {number} status The HTTP status the server would answer with.
 * @property {boolean} success
 * @property {*} response
 * @property {*} error
 * @property {Object} body The JSON the server sends.
 * @property {Array} faults The errors the server would log at error level.
 */

/**
 * @typedef {Object} ErrorSink
 * @property {Array<{ source: string, error: * }>} errors
 * @property {(entry: { source: string, error: * }) => void} add
 */

const HOST_KEYS = [
  'call',
  'close',
  'dataSession',
  'dataSetName',
  'errorSink',
  'findDocuments',
  'loadClientPlugins',
  'readArtifact',
  'readPageConfig',
  'resolveUser',
  'rootConfig',
  'userNames',
];

// Checks a host against the shape above, so a host that misses a part fails where it is made,
// not in the middle of a journey.
function createHeadlessHost(host) {
  if (!type.isObject(host)) {
    throw new Error(`A headless host is an object. Received ${JSON.stringify(host)}.`);
  }
  const missing = HOST_KEYS.filter((key) => type.isUndefined(host[key]));
  if (missing.length > 0) {
    throw new Error(`The headless host is missing ${missing.join(', ')}.`);
  }
  return host;
}

export { HOST_KEYS };
export default createHeadlessHost;
