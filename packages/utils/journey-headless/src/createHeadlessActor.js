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

import { createStepRunner, updateLowdefyPage, waitForSettle } from '@lowdefy/client-core';
import getContext from '@lowdefy/engine';
import { serializer, type } from '@lowdefy/helpers';

import createActorClient from './createActorClient.js';
import createLocation from './createLocation.js';
import fireMountEvents from './fireMountEvents.js';
import registerBlockStandIns from './registerBlockStandIns.js';
import reportParseErrors from './reportParseErrors.js';

// The settle after a step is capped, as the browser runner's is: it never fails a step.
const SETTLE_MS = 5000;

function readQuery(query) {
  if (type.isNone(query) || query === '') {
    return {};
  }
  if (type.isString(query)) {
    return Object.fromEntries(new URLSearchParams(query));
  }
  return query;
}

// One person in a headless journey (the journey's user, or one an `as` step switches to), as a
// browser journey's actor is one browser context: the pages they open, in Node, on the client
// engine.
// - load({ pageId | path, pathParams, urlQuery }): a full page load (a goto, the journey's first
//   page): a new lowdefy object, then the page is shown.
// - A Link the page follows is a client-side navigation: the next page is shown on the same
//   lowdefy object, as the web client's router does, and joins the history. back() goes back one
//   page, by a full load when that page was opened by an earlier load.
// - Showing a page runs what the web client's components run: the app's and the page's onInit
//   and onInitAsync, then onMount on every block it mounts. Modals and Drawers start closed; their
//   setOpen and toggleOpen stand-ins open them, fire their onOpen and onClose and mount their
//   content (registerBlockStandIns).
// - stepRunner is client-core's step runner on the shown page; idle() waits for a navigation the
//   page started.
// `calls`, `messages` and `navigations` record what the actor's pages did; leftApp is the URL of a
// link out of the app; browserOnly lists why a step needs the browser after all (an action only a
// browser can carry out, a click a browser would land inside a block).
function createHeadlessActor({ host, name, onTrace, plugins, stepTimeout, user }) {
  const rootConfig = serializer.deserialize(host.rootConfig);
  const pending = new Set();
  const actor = {
    browserOnly: [],
    calls: [],
    history: [],
    leftApp: null,
    messages: [],
    name,
    navigations: [],
    page: null,
    user,
  };
  let client = null;
  let loadCount = 0;

  function track(promise) {
    pending.add(promise);
    promise
      .catch((error) => host.errorSink.add({ error, source: 'client' }))
      .finally(() => pending.delete(promise));
    return promise;
  }

  const router = {
    basePath: '',
    back: () => {
      actor.navigations.push({ method: 'back' });
      return track(back());
    },
    push: (target) => {
      actor.navigations.push({ method: 'push', ...target });
      return track(navigate({ ...target, replace: false }));
    },
    replace: (target) => {
      actor.navigations.push({ method: 'replace', ...target });
      return track(navigate({ ...target, replace: true }));
    },
  };

  async function readPage({ pageId, path, pathParams, urlQuery }) {
    return host.readPageConfig({ pageId, path, pathParams, urlQuery, user });
  }

  function setOpen({ block, open }) {
    const { openBlocks, mounted, context } = actor.page;
    if (openBlocks.has(block.id) === open) {
      return;
    }
    if (open) {
      openBlocks.add(block.id);
      block.triggerEvent({ name: 'onOpen' });
      track(fireMountEvents({ context, mounted, openBlocks }));
    } else {
      openBlocks.delete(block.id);
      block.triggerEvent({ name: 'onClose' });
    }
    context._internal.update();
  }

  async function show({ page, urlQuery }) {
    const config = serializer.deserialize({ pageConfig: page.pageConfig, rootConfig });
    const { lowdefy, globals, appContext } = client;
    globals.window.location = createLocation({ path: page.matchedPath, urlQuery });
    updateLowdefyPage({
      config,
      lowdefy,
      matchedPath: page.matchedPath,
      pathParams: page.pathParams,
      user: host.resolveUser(user),
    });
    const context = getContext({
      config: config.pageConfig,
      jsMap: plugins.jsMap,
      lowdefy,
      pathParams: page.pathParams,
    });
    actor.page = {
      context,
      matchedPath: page.matchedPath,
      mounted: new Set(),
      openBlocks: new Set(),
      pageId: page.pageId,
      reportedParseErrors: new Set(),
      urlQuery: urlQuery ?? {},
    };
    const progress = () => undefined;
    await appContext._internal.runOnInit(progress);
    appContext._internal.runOnInitAsync(progress);
    await context._internal.runOnInit(progress);
    context._internal.runOnInitAsync(progress);
    registerBlockStandIns({ context, openBlocks: actor.page.openBlocks, setOpen });
    await fireMountEvents({
      context,
      mounted: actor.page.mounted,
      openBlocks: actor.page.openBlocks,
    });
    reportParseErrors({ handleError: lowdefy._internal.handleError, page: actor.page });
  }

  async function load({ pageId, path, pathParams, urlQuery }) {
    const page = await readPage({ pageId, path, pathParams, urlQuery });
    loadCount += 1;
    client = createActorClient({
      actor,
      host,
      onBrowserOnly: (reason) => actor.browserOnly.push(reason),
      onTrace,
      plugins,
      rootConfig,
      router,
    });
    actor.history.push({ load: loadCount, path: page.matchedPath, urlQuery: urlQuery ?? {} });
    await show({ page, urlQuery });
  }

  async function navigate({ pathname, query, replace }) {
    const urlQuery = readQuery(query);
    const page = await readPage({ path: pathname.replace(/^\/+/, ''), urlQuery });
    const entry = { load: loadCount, path: page.matchedPath, urlQuery };
    if (replace) {
      actor.history[actor.history.length - 1] = entry;
    } else {
      actor.history.push(entry);
    }
    await show({ page, urlQuery });
  }

  async function back() {
    if (actor.history.length < 2) {
      throw new Error('There is no earlier page to go back to.');
    }
    actor.history.pop();
    const previous = actor.history[actor.history.length - 1];
    if (previous.load !== loadCount) {
      actor.history.pop();
      await load({ path: previous.path, urlQuery: previous.urlQuery });
      return;
    }
    const page = await readPage({ path: previous.path, urlQuery: previous.urlQuery });
    await show({ page, urlQuery: previous.urlQuery });
  }

  function getPageContext() {
    if (actor.page === null) {
      return { error: 'No page is open.' };
    }
    return { context: actor.page.context, page: { pageId: actor.page.pageId } };
  }

  async function idle() {
    while (pending.size > 0) {
      await Promise.allSettled([...pending]);
    }
  }

  async function settle() {
    await idle();
    if (client === null) {
      return true;
    }
    registerBlockStandIns({
      context: actor.page.context,
      openBlocks: actor.page.openBlocks,
      setOpen,
    });
    const settled = await waitForSettle({
      getPageContext,
      lowdefy: client.lowdefy,
      timeout: Math.min(stepTimeout, SETTLE_MS),
    });
    reportParseErrors({ handleError: client.lowdefy._internal.handleError, page: actor.page });
    return settled;
  }

  actor.back = back;
  actor.getLowdefy = () => client?.lowdefy;
  actor.getPageContext = getPageContext;
  actor.idle = idle;
  actor.load = load;
  actor.settle = settle;
  actor.url = () => client?.globals.window.location.href ?? null;
  actor.stepRunner = createStepRunner({
    getLowdefy: () => client?.lowdefy,
    getPageContext,
    hostName: 'headless run',
    timeout: stepTimeout,
  });
  return actor;
}

export default createHeadlessActor;
