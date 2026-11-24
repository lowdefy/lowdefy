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

import collectBlockParents from './collectBlockParents.js';
import createActorClient from './createActorClient.js';
import createLocation from './createLocation.js';
import fireMountEvents from './fireMountEvents.js';
import movePopupFocus from './movePopupFocus.js';
import readOptionLabelText from './readOptionLabelText.js';
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
//   and onInitAsync, then its subscriptions open (each succeeds and no message arrives), then
//   onMount on every block it mounts. Whenever the engine updates a block, and whenever a block's
//   onMount finishes, the mounts are checked again (checkMounts), as React renders again: content
//   a loading block's skeleton held back mounts once it stops loading. Popup blocks (Modal, Drawer,
//   ConfirmModal) start closed; the methods their stand-ins register open them, fire their open
//   and close events and mount their content through setOpen (registerBlockStandIns).
// - page.inputFocused and page.pointerBlockId say whether an input has the focus and which block
//   the pointer rests on, for a press of Escape (runHeadlessStep's noteFocus). A popup opening or
//   closing moves the focus too (movePopupFocus): page.focusReturns keeps, by popup id, the input
//   the focus left as the popup opened, which it hands the focus back to as it closes.
// - page.openedBlocks holds the popups opened on the shown page at any time: antd keeps their
//   content in the page, hidden, once they close (unless destroyOnHidden), which a text check reads.
// - page.standIns holds what each block's stand-in keeps for the shown page, by block id
//   (readStandInState): a dropdown's open state and selected keys, a confirm dialog's status.
//   track(promise) holds an event a stand-in fired until settle, and sends its error to the
//   host's error sink.
// - stepRunner is client-core's step runner on the shown page; idle() waits for a navigation the
//   page started.
// `calls`, `messages` and `navigations` record what the actor's pages did; leftApp is the URL of a
// link out of the app; browserOnly lists why a step needs the browser after all (an action only a
// browser can carry out, a click a browser would land inside a block); landedControl is the
// control a click by text or containing landed on ({ blockId, control, rowKey }), which the
// journey's step result carries for lint L8, cleared before each step.
function createHeadlessActor({ host, name, onTrace, plugins, stepTimeout, user }) {
  const rootConfig = serializer.deserialize(host.rootConfig);
  const pending = new Set();
  const actor = {
    browserOnly: [],
    calls: [],
    history: [],
    // The app's i18n config, which the web client hands lowdefy.i18n and antd's locale reads.
    i18n: rootConfig.i18n ?? null,
    landedControl: undefined,
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

  // Checks the page's mounts against what the web client now renders (fireMountEvents). First it
  // watches every block of the page, list rows added since included: the engine calls a block's
  // updaters when it updates the block, as it re-renders a Block component. Then it registers the
  // methods of the blocks that now render (registerBlockStandIns), as a component registers them
  // as it renders, before React runs the onMount effects: a panel that mounts once a skeleton
  // ends can call a method of a block that mounts with it. A page no longer shown is left alone
  // (a navigation can replace it while its onInit runs). Async, so whatever throws reaches track.
  async function checkMounts(page) {
    if (actor.page !== page) {
      return;
    }
    const { context, watched } = page;
    collectBlockParents({ context }).blocks.forEach((block) => {
      if (!watched.has(block.id)) {
        watched.set(block.id, context._internal.updaters.register(block.id, page.onUpdate));
      }
    });
    registerBlockStandIns({ actor });
    return fireMountEvents({ actor, onMountFinished: page.onUpdate });
  }

  // React renders after the engine's update has run, so the check waits a microtask, and one
  // check follows any number of updates in between. A page no longer shown is left alone.
  function scheduleMountCheck(page) {
    if (page.mountCheckScheduled) {
      return;
    }
    page.mountCheckScheduled = true;
    queueMicrotask(() => {
      page.mountCheckScheduled = false;
      if (actor.page === page) {
        track(checkMounts(page));
      }
    });
  }

  // Opens or closes a popup block (POPUP_BLOCK_TYPES) as antd's `open` prop does: its content
  // shows, and mounts, only while it is open. Fires none of the block's events, which its stand-in
  // fires in the component's order (BLOCK_STAND_INS), and moves the focus as the component does
  // (movePopupFocus). Returns whether the open state changed.
  function setOpen({ block, open }) {
    const { openBlocks, context } = actor.page;
    if (openBlocks.has(block.id) === open) {
      return false;
    }
    if (open) {
      openBlocks.add(block.id);
      actor.page.openedBlocks.add(block.id);
      track(checkMounts(actor.page));
    } else {
      openBlocks.delete(block.id);
    }
    movePopupFocus({ actor, block, open });
    context._internal.update();
    return true;
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
    // The web client keeps a page's Context mounted while its context stays the same (a static
    // page shown again), so its subscriptions stay as they are. Another context unmounts the page
    // shown before, which closes its subscriptions (WebSocketsEffect).
    const previousContext = actor.page?.context;
    const sameContext = previousContext === context;
    if (!type.isUndefined(previousContext) && !sameContext) {
      previousContext._internal.WebSockets.unsubscribeAll();
    }
    actor.page?.watched.forEach((unregister) => unregister());
    const shown = {
      context,
      matchedPath: page.matchedPath,
      mountCheckScheduled: false,
      mounted: new Map(),
      mountFinished: new Set(),
      onUpdate: () => scheduleMountCheck(shown),
      focusReturns: new Map(),
      inputFocused: false,
      openBlocks: new Set(),
      openedBlocks: new Set(),
      pageId: page.pageId,
      pointerBlockId: null,
      reportedParseErrors: new Set(),
      standIns: new Map(),
      urlQuery: urlQuery ?? {},
      watched: new Map(),
    };
    actor.page = shown;
    const progress = () => undefined;
    await appContext._internal.runOnInit(progress);
    appContext._internal.runOnInitAsync(progress);
    await context._internal.runOnInit(progress);
    context._internal.runOnInitAsync(progress);
    registerBlockStandIns({ actor });
    // The web client's WebSocketsEffect opens the page's subscriptions once onInit has run, before
    // the blocks' onMount; the websocket client is inert (createActorClient).
    if (!sameContext) {
      context._internal.WebSockets.subscribeAll();
    }
    await checkMounts(shown);
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
    registerBlockStandIns({ actor });
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
  actor.setOpen = setOpen;
  actor.settle = settle;
  actor.track = track;
  actor.url = () => client?.globals.window.location.href ?? null;
  actor.stepRunner = createStepRunner({
    getLowdefy: () => client?.lowdefy,
    getPageContext,
    hostName: 'headless run',
    readLabelText: readOptionLabelText,
    timeout: stepTimeout,
  });
  return actor;
}

export default createHeadlessActor;
