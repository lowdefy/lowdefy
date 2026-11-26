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

import { UserError } from '@lowdefy/errors';
import { get, type } from '@lowdefy/helpers';

import createErrorSink from '../createErrorSink.js';
import runHeadlessJourney from '../runHeadlessJourney.js';

// A small headless app for unit tests: pages written as a person writes them (blocks, events as
// action lists), turned into the shape the build writes (as blocks-native's test buildPage does),
// run by runHeadlessJourney on a host with no server. A run with `dataSet` ({ name, connections,
// artifacts }) is a data-set journey on data set `name`: connections is the connection plugin
// map, and artifacts the build artifacts beside the pages (requests, connections, endpoints), by
// their path in the build. Its actions:
// - Record: appends { blockId, name: params, event } to the run's log, the event the action ran
//   for, so a test reads which events fired, in order, with their payloads.
// - Refuse: fails the event with a UserError, an expected outcome (success: false).
// - Fail: fails the event with an Error, an app error.
// - SetFocus: a browser-only action, which the runner replaces with its stub.
// - Wait: waits `params` ms, as a request that takes that long to answer does.
// - Request: appends { blockId, name: 'request:<requestId>' } to the log, and sends nothing.
// - CallMethod, Link (to a pageId), SetState, Subscribe, Unsubscribe and Publish, as actions-core's.
// A page's subscriptions are written as on a page, each with its events as action lists.
// Its operators are _state, as operators-js reads state with a path, and _js, which calls the
// function the page's jsMap holds for its hash and fails as operators-js does when it holds none.
// A page's _jsEntries (module text, as the dev server's page route sends it) rides on its config;
// `jsMap` is the client map the app loaded, {} by default.

const BLOCK_METAS = {
  AgGridAlpine: { category: 'display' },
  AgGridBalham: { category: 'display' },
  AgGridLowdefy: { category: 'display' },
  AgGridMaterial: { category: 'display' },
  Alert: { category: 'container' },
  antd_DropdownMenu: { category: 'container' },
  Box: { category: 'container' },
  Card: { category: 'container' },
  ConfigProvider: { category: 'container' },
  DangerousHtml: { category: 'display' },
  DangerousMarkdown: { category: 'display' },
  Descriptions: { category: 'container' },
  Divider: { category: 'display' },
  Button: { category: 'display' },
  ClickableHtml: { category: 'display' },
  ColorSelector: { category: 'input', valueType: 'string' },
  ConfirmModal: { category: 'container' },
  DateSelector: { category: 'input', valueType: 'date' },
  Drawer: { category: 'container' },
  DropdownButton: { category: 'display' },
  DropdownMenu: { category: 'container' },
  Html: { category: 'display' },
  Icon: { category: 'display' },
  Label: { category: 'container' },
  Markdown: { category: 'display' },
  MarkdownWithCode: { category: 'display' },
  Menu: { category: 'display' },
  Modal: { category: 'container' },
  MultipleSelector: { category: 'input', valueType: 'array' },
  NumberInput: { category: 'input', valueType: 'number' },
  Paragraph: { category: 'display' },
  RadioSelector: { category: 'input', valueType: 'any' },
  // A block from an app's own plugin, which no headless stand-in models.
  PluginChain: { category: 'display' },
  // A block from an app's own plugin whose meta declares the properties it draws as text.
  PluginBanner: { category: 'display', headlessText: ['title', 'body.text'] },
  // A container from an app's own plugin whose meta declares its text but not its areas.
  PluginPanel: { category: 'container', headlessText: ['title'] },
  Statistic: { category: 'display' },
  Tag: { category: 'display' },
  Title: { category: 'display' },
  // A plugin block whose meta declares its run method fires onRun headless, and its merge method,
  // which changes only what the block draws, a no-op.
  PluginRunChain: { category: 'display', headlessMethods: { run: 'onRun', merge: null } },
  Selector: { category: 'input', valueType: 'string' },
  Table: { category: 'input-container', valueType: 'object' },
  TextInput: { category: 'input', valueType: 'string' },
  TreeMultipleSelector: { category: 'input', valueType: 'array' },
  TreeSelector: { category: 'input', valueType: 'any' },
};

function buildEvents(events) {
  return Object.fromEntries(
    Object.entries(events).map(([name, actions]) => [
      name,
      type.isArray(actions) ? { try: actions, catch: [] } : { catch: [], ...actions },
    ])
  );
}

function buildBlock({ block, pageId }) {
  const { blocks, events, id, slots, ...rest } = block;
  const built = { ...rest, id: `block:${pageId}:${id}:0`, blockId: id };
  if (!type.isNone(events)) built.events = buildEvents(events);
  const builtSlots = { ...(slots ?? {}) };
  if (type.isArray(blocks)) {
    builtSlots.content = { ...builtSlots.content, blocks };
  }
  if (Object.keys(builtSlots).length > 0) {
    built.slots = Object.fromEntries(
      Object.entries(builtSlots).map(([key, slot]) => [
        key,
        {
          ...slot,
          blocks: (slot.blocks ?? []).map((child) => buildBlock({ block: child, pageId })),
        },
      ])
    );
  }
  return built;
}

// A subscription as the build writes it (buildSubscriptions): its client options defaulted and
// its events as action lists.
function buildSubscription(subscription) {
  return {
    payload: {},
    ...subscription,
    client: {
      maxMessages: 100,
      subscribeOnMount: true,
      throttleRender: 250,
      ...subscription.client,
    },
    events: buildEvents(subscription.events ?? {}),
  };
}

function buildPage(pageConfig) {
  const { id, subscriptions = [], ...rest } = pageConfig;
  const root = buildBlock({ block: { type: 'Box', id, ...rest }, pageId: id });
  return {
    ...root,
    id: `page:${id}`,
    pageId: id,
    blockId: id,
    path: id,
    linkPaths: {},
    subscriptions: subscriptions.map(buildSubscription),
    requests: [],
  };
}

// Runs `steps` on the first of `pages`, with the root config's `menus`. Resolves
// { result, log }: the journey's result and the Record log.
async function runTestJourney({
  dataSet,
  i18n,
  jsMap = {},
  menus = [],
  pages,
  steps,
  stepTimeout = 300,
}) {
  const log = [];
  const built = Object.fromEntries(pages.map((page) => [page.id, buildPage(page)]));
  const rootConfig = {
    home: { pageId: pages[0].id },
    ...(i18n === undefined ? {} : { i18n }),
    menus,
    pagePaths: Object.fromEntries(pages.map((page) => [page.id, page.id])),
  };
  const host = {
    call: () => {
      throw new Error('The test app has no requests.');
    },
    close: () => undefined,
    connections: dataSet?.connections ?? {},
    dataSession: null,
    dataSetName: dataSet?.name ?? null,
    errorSink: createErrorSink(),
    findDocuments: () => [],
    loadClientPlugins: async () => ({
      actions: {
        CallMethod: ({ methods, params }) => methods.callMethod(params),
        Record: ({ methods, params }) => {
          log.push({ blockId: methods.getBlockId(), name: params, event: methods.getEvent(true) });
        },
        Fail: () => {
          throw new Error('Failed.');
        },
        Refuse: () => {
          throw new UserError('Refused.');
        },
        Request: ({ methods, params }) => {
          log.push({ blockId: methods.getBlockId(), name: `request:${params}` });
        },
        SetFocus: () => undefined,
        Link: ({ methods, params }) => methods.link({ pageId: params }),
        Publish: ({ methods, params }) => methods.publish(params),
        SetState: ({ methods, params }) => methods.setState(params),
        Subscribe: ({ methods, params }) => methods.subscribe(params),
        Unsubscribe: ({ methods, params }) => methods.unsubscribe(params),
        Wait: ({ params }) => new Promise((resolve) => setTimeout(resolve, params)),
      },
      blockMetas: BLOCK_METAS,
      jsMap,
      operators: {
        _js: ({ jsMap: pageJsMap, params }) => {
          if (!pageJsMap[params]) {
            throw new Error(`_js function not found. Received hash: ${params}`);
          }
          return pageJsMap[params]({});
        },
        _state: ({ params, state }) => get(state, params),
      },
    }),
    readArtifact: (name) => {
      const pageId = name.match(/^pages\/([^/]+)\.json$/)?.[1];
      if (!type.isUndefined(pageId) && Object.hasOwn(built, pageId)) {
        return built[pageId];
      }
      return dataSet?.artifacts?.[name] ?? null;
    },
    readPageConfig: async ({ pageId, path }) => {
      const id = pageId ?? path;
      if (!Object.hasOwn(built, id)) {
        throw new Error(`The test app has no page "${id}".`);
      }
      return { matchedPath: id, pageConfig: built[id], pageId: id, pathParams: {} };
    },
    resolveUser: () => null,
    rootConfig,
    scrubCredentials: (value) => value,
    system: () => undefined,
    userNames: [],
    webhook: () => undefined,
  };
  const result = await runHeadlessJourney({
    configDirectory: process.cwd(),
    host,
    journey: { pageId: pages[0].id, steps },
    stepTimeout,
  });
  return { log, result, errors: host.errorSink.errors };
}

// A Record action for `name`, to list in an event.
function record(name) {
  return { id: `record_${name}`, type: 'Record', params: name };
}

// A Refuse action, to fail an event with an expected outcome.
const refuse = { id: 'refuse', type: 'Refuse' };

// A Button that calls `method` on `blockId` with `args` when clicked.
function methodButton({ id, blockId, method, args = [] }) {
  return {
    id,
    type: 'Button',
    events: {
      onClick: [{ id: 'call', type: 'CallMethod', params: { blockId, method, args } }],
    },
  };
}

// The Record log as [name, event] pairs, in the order the events ran.
function readLog(log) {
  return log.map(({ event, name }) => (event === undefined ? [name] : [name, event]));
}

export { methodButton, readLog, record, refuse };
export default runTestJourney;
