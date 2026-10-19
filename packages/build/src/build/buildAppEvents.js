/* eslint-disable no-param-reassign */

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
import { ConfigError } from '@lowdefy/errors';

import buildEvents from './buildPages/buildBlock/buildEvents.js';
import countOperators from '../utils/countOperators.js';
import createPageTypeCounters from './buildPages/createPageTypeCounters.js';
import validateCallApiRefs from './buildPages/validateCallApiRefs.js';
import validateLinkReferences from './buildPages/validateLinkReferences.js';
import validateOrgClientActionRefs from './buildPages/validateOrgClientActionRefs.js';
import validateWebsocketRefs from './buildPages/validateWebsocketRefs.js';

const APP_EVENTS = ['onInit', 'onInitAsync'];

// App events run before any page's state, blocks or requests exist, and keep
// running across navigations, so what reads or changes one page cannot work here.
const PAGE_ACTIONS = [
  'CallMethod',
  'Request',
  'Reset',
  'ResetValidation',
  'SetFocus',
  'SetState',
  'Subscribe',
  'Unsubscribe',
  'Validate',
];
const PAGE_OPERATORS = ['_input', '_request', '_request_details', '_state', '_websocket'];

function checkPageScopedTypes({ counter, names, kind }) {
  names.forEach((name) => {
    if (counter.getCount(name) > 0) {
      throw new ConfigError(
        `${kind} "${name}" can not be used in app events. App events run outside any page, so page state, inputs, requests, blocks and subscriptions are not available.`,
        { configKey: counter.getLocation(name) }
      );
    }
  });
}

function buildAppEvents({ components, context }) {
  const configKey = components['~k'];
  if (type.isNone(components.events)) {
    components.events = {};
  }
  if (!type.isObject(components.events)) {
    throw new ConfigError('App "events" should be an object.', {
      received: components.events,
      configKey,
    });
  }
  Object.keys(components.events).forEach((eventName) => {
    if (eventName.startsWith('~')) return;
    const eventConfigKey = components.events[eventName]?.['~k'] ?? configKey;
    if (!APP_EVENTS.includes(eventName)) {
      throw new ConfigError(
        `App event "${eventName}" is not supported. Supported app events: ${APP_EVENTS.join(
          ', '
        )}.`,
        { configKey: eventConfigKey }
      );
    }
    if (
      type.isObject(components.events[eventName]) &&
      !type.isNone(components.events[eventName].shortcut)
    ) {
      throw new ConfigError(`App event "${eventName}" can not have a shortcut.`, {
        configKey: eventConfigKey,
      });
    }
  });

  const { pageCounters, typeCounters } = createPageTypeCounters({
    typeCounters: context.typeCounters,
  });
  // Every page runs the app events if it is the first to load, so every page's
  // type set carries their types (buildPageTypes).
  context.appTypeCounters = pageCounters;
  const refs = {
    callApiActionRefs: [],
    linkActionRefs: [],
    orgClientActionRefs: [],
    websocketActionRefs: [],
  };
  buildEvents(
    { blockId: 'app', events: components.events, '~k': configKey },
    {
      ...refs,
      callMethodActionRefs: [],
      context,
      pageId: 'app',
      requestActionRefs: [],
      shortcutRefs: [],
      typeCounters,
    }
  );
  countOperators(components.events, { counter: typeCounters.operators.client });
  checkPageScopedTypes({ counter: pageCounters.actions, names: PAGE_ACTIONS, kind: 'Action' });
  checkPageScopedTypes({
    counter: pageCounters.operators,
    names: PAGE_OPERATORS,
    kind: 'Operator',
  });

  validateLinkReferences({
    linkActionRefs: refs.linkActionRefs,
    pageIds: (components.pages ?? []).map((page) => page.pageId),
    context,
  });
  validateCallApiRefs({
    callApiActionRefs: refs.callApiActionRefs,
    endpointConfigs: type.isArray(components.api) ? components.api : [],
    context,
  });
  validateOrgClientActionRefs({
    orgClientActionRefs: refs.orgClientActionRefs,
    policy: components.auth?.organizations?.policy ?? 'pinned',
    context,
  });
  validateWebsocketRefs({
    websocketActionRefs: refs.websocketActionRefs,
    websocketIds: context.websocketIds ?? new Set(),
    context,
  });
  return components;
}

export default buildAppEvents;
