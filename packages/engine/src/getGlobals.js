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

/**
 * The host globals: everything outside JavaScript that the engine, the operators and the action
 * plugins reach, set by the host on `lowdefy._internal.globals`. The engine and operators never
 * read a bare `window` or `document`, so they run on any JavaScript runtime the host fills this
 * in for. The web client passes the browser's own objects. A host without a browser passes plain
 * objects with the members below; members marked optional may be left out.
 *
 * The keys stay `window` and `document` because action plugins and the web renderer read them
 * too. The web renderer reads more of the browser's objects than listed here (history, focus and
 * resize listeners, localStorage); those belong to the renderer, not to this contract.
 *
 * @typedef {Object} HostGlobals
 * @property {Function} fetch The Fetch API, used by the request layer and the Fetch action.
 * @property {HostWindow} window
 * @property {HostDocument} [document]
 */

/**
 * @typedef {Object} HostLocation The URL of the page being shown. Read when it is needed, never
 * cached, so a host may pass a live object (the browser's `window.location`) or getters.
 * @property {string} href The full URL. Trace reads it to find the page an event belongs to.
 * @property {string} origin Link resolution places relative and schemeless URLs against it.
 * @property {string} pathname
 * @property {string} search The query string, with its leading `?` (`_url_query`, getUrlQuery).
 * @property {string} hash
 * @property {string} [host] Read only by the `_location` operator.
 * @property {string} [hostname] Read only by the `_location` operator.
 * @property {string} [port] Read only by the `_location` operator.
 * @property {string} [protocol] Read only by the `_location` operator.
 */

/**
 * @typedef {Object} HostWindow
 * @property {HostLocation} location
 * @property {number} innerWidth The viewport width, for `_media` and its dependency tracking.
 * @property {number} innerHeight The viewport height, for `_media`.
 * @property {{ state: *, replaceState: Function }} [history] The browser's history, which the
 *   MagicLinkVerify action uses to clear the sign-in token from the URL fragment. Web only.
 * @property {Event} [event] The DOM event whose listeners are running (the browser's
 *   `window.event`). A host without DOM events leaves it out: no event bubbles through nested
 *   blocks there, so no block's event is skipped as a copy of another's (claimDomEvent).
 * @property {boolean} [__lowdefyFullEvaluation] true turns dependency tracking off, for debugging.
 * @property {boolean} [__lowdefy_isDark] Whether the dark theme is showing, for `_media`.
 * @property {string} [__lowdefy_darkModePreference] 'light', 'dark' or 'system', for `_media`.
 * @property {Object} [__lowdefy_antd_locale] The antd locale's texts, which trace counts as
 *   config text.
 */

/**
 * @typedef {Object} HostDocument
 * @property {(id: string) => (Object|null)} [getElementById] Finds a block's layout element
 *   (`bl-<blockId>`) on a DOM event's path. Needed only with `window.event`.
 * @property {(tag: string) => Object} [createElement] With body, used by the MagicLinkVerify
 *   action to post the sign-in token as a form. Web only.
 * @property {Object} [body]
 * @property {(selector: string) => (Object|null)} [querySelector] Used by the SetFocus and
 *   ScrollTo actions on the web.
 * @property {'visible'|'hidden'} [visibilityState] Whether the app is in front, read by the page
 *   lifecycle for onVisible and onHidden.
 * @property {(name: 'visibilitychange', listener: Function) => void} [addEventListener] Calls
 *   the listener when visibilityState changes.
 * @property {(name: 'visibilitychange', listener: Function) => void} [removeEventListener]
 */

// lowdefy._internal is set by the host. Engine harnesses and server rendering run without globals,
// and the trace registry can be used before the client initialises lowdefy._internal.
function getGlobals(lowdefy) {
  return lowdefy._internal?.globals ?? {};
}

export default getGlobals;
