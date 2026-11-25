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

import createScopedCall from './createScopedCall.js';
import scrubMarkedValues from './scrubMarkedValues.js';

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
 * @property {(args: { endpointId: string, payload: *, organization: (string|null),
 *   caller: ({ id: string, name: string }|null) }) => Promise<HostAnswer>} system Runs an
 *   endpoint as a cron or detached run does, in process: runDetachedEndpoint with a system
 *   principal, so an InternalApi endpoint is callable. With no organization there is no user;
 *   with one the principal carries it and the stand-in caller, as a detached call from a CallApi
 *   bound to them does, so `_user` is { id, name, organization_id, system: true } (null with no
 *   caller) and the tenant wall uses the organization. A `call` step `as: system` or
 *   `as: { system: { organization, caller } }` makes it.
 * @property {(args: { endpointId: string, rawBody: string, query?: Object, headers?: Object }) =>
 *   Promise<WebhookAnswer>} webhook Posts to a webhook endpoint as its sender does, in process:
 *   runWebhookEndpoint, as the endpoints route runs it, so its verify gate runs against rawBody.
 * @property {Object|null} dataSession The data session the calls run on
 *   (@lowdefy/test-utils/dataSets), which holds its stubs, fail gates, pause gates, sunk
 *   requests and the forced failures its error sink recorded; null for a journey with no data set
 *   on a host that runs it on none. A hold step sets its pause gate here.
 * @property {string|null} dataSetName The data set the data was loaded from, or null for none. A
 *   journey on a data set checks each step that acts on a block against the data-set rails
 *   (createDataSetRails in @lowdefy/node-utils), as the browser runner does.
 * @property {Object} connections The app's connection plugin map, by connection type, as the
 *   data-session gate reads it: what the data-set rails read each connection type's
 *   meta.dataSet declaration from.
 * @property {(name: string) => (Object|null)} readArtifact A build artifact by its path in the
 *   build ("routes.json", "pages/home.json", "api/notify.json"), deserialized, or null when the
 *   build has none: what the runner checks a step's ids against. Both hosts read through
 *   createArtifactReader in @lowdefy/node-utils, so a value is shared by every caller and frozen.
 * @property {(args: { collection: string, connectionId?: string, match: Object }) =>
 *   Promise<Object[]>} findDocuments The documents `match` finds in a collection of the data's
 *   database (the connection's, or the only one), in _id order, as JSON values, for expect.db.
 * @property {ErrorSink} errorSink Where the server's faults and the client's errors go, for the
 *   run's invariants.
 * @property {(user?: *) => (Object|null)} resolveUser The user object a page renders for a user
 *   as calls take one, the host's user by default; null for a signed-out caller.
 * @property {string[]} userNames The data set's users by name, whom an `as` step can switch to.
 * @property {() => Promise<void>} close Releases what the host holds.
 * @property {{ run: Function, bindScrub: Function }} credentialScope runInCredentialScope and
 *   bindCredentialScrub from the @lowdefy/node-utils the host's @lowdefy/api imports. Each call,
 *   system call and webhook runs in a credential scope of its own, as the server runs each
 *   request (createScopedCall).
 *
 * createHeadlessHost adds scrubCredentials: (value) => value, a copy of a value with every string
 * scrubbed of what the host's calls marked so far, which the runner applies to the journey's
 * result.
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
 * @property {Array<{ endpointId: string, payload: * }>} detached The detached CallApi calls the
 *   call's routine made, in order: recorded for expect.calls (recordDetachedCalls).
 */

/**
 * @typedef {Object} WebhookAnswer As the endpoints route answers a webhook.
 * @property {number} status The HTTP status the sender receives.
 * @property {*} body The JSON the route sends, or the text of a text/plain answer.
 * @property {string} contentType "application/json" or "text/plain".
 * @property {Array} faults The errors the server would log at error level.
 * @property {Array<{ endpointId: string, payload: * }>} detached As a HostAnswer's.
 * @property {string} rid The call's request id: a routine that failed answers with no request id,
 *   so the message of a forced failure is read by this one (readForcedError).
 */

/**
 * @typedef {Object} ErrorSink
 * @property {Array<{ source: string, error: * }>} errors
 * @property {(entry: { source: string, error: * }) => void} add
 */

const HOST_KEYS = [
  'call',
  'close',
  'connections',
  'credentialScope',
  'dataSession',
  'dataSetName',
  'errorSink',
  'findDocuments',
  'loadClientPlugins',
  'readArtifact',
  'readPageConfig',
  'resolveUser',
  'rootConfig',
  'system',
  'userNames',
  'webhook',
];

// The parts that run a routine on the server, each in a credential scope of its own.
const SCOPED_KEYS = ['call', 'system', 'webhook'];

// Checks a host against the shape above, so a host that misses a part fails where it is made,
// not in the middle of a journey, and runs its calls each in a credential scope of its own, as
// the server runs each request, so every host gives an endpoint the scope a real request gives it.
// What the calls mark is kept out of the journey's result (scrubCredentials).
function createHeadlessHost(host) {
  if (!type.isObject(host)) {
    throw new Error(`A headless host is an object. Received ${JSON.stringify(host)}.`);
  }
  const missing = HOST_KEYS.filter((key) => type.isUndefined(host[key]));
  if (missing.length > 0) {
    throw new Error(`The headless host is missing ${missing.join(', ')}.`);
  }
  const scrubs = [];
  const scoped = { ...host };
  SCOPED_KEYS.forEach((key) => {
    scoped[key] = createScopedCall({
      credentialScope: host.credentialScope,
      onScope: (scrub) => scrubs.push(scrub),
      run: host[key],
    });
  });
  scoped.scrubCredentials = (value) => scrubMarkedValues({ scrubs, value });
  return scoped;
}

export { HOST_KEYS };
export default createHeadlessHost;
