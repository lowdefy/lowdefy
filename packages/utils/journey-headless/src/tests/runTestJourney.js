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
import { type } from '@lowdefy/helpers';

import createErrorSink from '../createErrorSink.js';
import runHeadlessJourney from '../runHeadlessJourney.js';

// A small headless app for unit tests: pages written as a person writes them (blocks, events as
// action lists), turned into the shape the build writes (as blocks-native's test buildPage does),
// run by runHeadlessJourney on a host with no server and no data. Its actions:
// - Record: appends { blockId, name: params, event } to the run's log, the event the action ran
//   for, so a test reads which events fired, in order, with their payloads.
// - Refuse: fails the event with a UserError, an expected outcome (success: false).
// - CallMethod and SetState, as actions-core's.

const BLOCK_METAS = {
  antd_DropdownMenu: { category: 'container' },
  Box: { category: 'container' },
  Button: { category: 'display' },
  ConfirmModal: { category: 'container' },
  Drawer: { category: 'container' },
  DropdownButton: { category: 'display' },
  DropdownMenu: { category: 'container' },
  Menu: { category: 'display' },
  Modal: { category: 'container' },
  Paragraph: { category: 'display' },
  Selector: { category: 'input', valueType: 'string' },
  TextInput: { category: 'input', valueType: 'string' },
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

function buildPage(pageConfig) {
  const { id, ...rest } = pageConfig;
  const root = buildBlock({ block: { type: 'Box', id, ...rest }, pageId: id });
  return {
    ...root,
    id: `page:${id}`,
    pageId: id,
    blockId: id,
    path: id,
    linkPaths: {},
    subscriptions: [],
    requests: [],
  };
}

// Runs `steps` on the first of `pages`, with the root config's `menus`. Resolves
// { result, log }: the journey's result and the Record log.
async function runTestJourney({ menus = [], pages, steps, stepTimeout = 300 }) {
  const log = [];
  const built = Object.fromEntries(pages.map((page) => [page.id, buildPage(page)]));
  const rootConfig = {
    home: { pageId: pages[0].id },
    menus,
    pagePaths: Object.fromEntries(pages.map((page) => [page.id, page.id])),
  };
  const host = {
    call: () => {
      throw new Error('The test app has no requests.');
    },
    close: () => undefined,
    dataSession: null,
    dataSetName: null,
    errorSink: createErrorSink(),
    findDocuments: () => [],
    loadClientPlugins: async () => ({
      actions: {
        CallMethod: ({ methods, params }) => methods.callMethod(params),
        Record: ({ methods, params }) => {
          log.push({ blockId: methods.getBlockId(), name: params, event: methods.getEvent(true) });
        },
        Refuse: () => {
          throw new UserError('Refused.');
        },
        SetState: ({ methods, params }) => methods.setState(params),
      },
      blockMetas: BLOCK_METAS,
      jsMap: {},
      operators: {},
    }),
    readArtifact: () => null,
    readPageConfig: async ({ pageId, path }) => {
      const id = pageId ?? path;
      if (!Object.hasOwn(built, id)) {
        throw new Error(`The test app has no page "${id}".`);
      }
      return { matchedPath: id, pageConfig: built[id], pageId: id, pathParams: {} };
    },
    resolveUser: () => null,
    rootConfig,
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
