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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import buildEvents from './buildBlock/buildEvents.js';
import countOperators from '../../utils/countOperators.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';

const SUBSCRIPTION_EVENTS = ['onMessage', 'onSubscribe', 'onError'];
const DEFAULT_MAX_MESSAGES = 100;
const DEFAULT_THROTTLE_RENDER = 250;
const MIN_THROTTLE_RENDER = 100;

function buildSubscription({ subscription, pageContext }) {
  const { context, pageId } = pageContext;
  const configKey = subscription['~k'];

  if (type.isUndefined(subscription.id)) {
    throw new ConfigError(`Subscription id missing at page "${pageId}".`, { configKey });
  }
  if (!type.isString(subscription.id)) {
    throw new ConfigError(`Subscription id is not a string at page "${pageId}".`, {
      received: subscription.id,
      configKey,
    });
  }
  pageContext.checkDuplicateSubscriptionId({ id: subscription.id, configKey, pageId });

  if (!context.websocketIds.has(subscription.id)) {
    throw new ConfigError(
      `Subscription "${subscription.id}" at page "${pageId}" references a websocket which does not exist.`,
      { configKey }
    );
  }

  if (type.isNone(subscription.payload)) {
    subscription.payload = {};
  }
  if (!type.isObject(subscription.payload)) {
    throw new ConfigError(
      `Subscription "${subscription.id}" at page "${pageId}" payload should be an object.`,
      { received: subscription.payload, configKey }
    );
  }

  if (type.isNone(subscription.client)) {
    subscription.client = {};
  }
  if (!type.isObject(subscription.client)) {
    throw new ConfigError(
      `Subscription "${subscription.id}" at page "${pageId}" client should be an object.`,
      { received: subscription.client, configKey }
    );
  }
  if (type.isNone(subscription.client.maxMessages)) {
    subscription.client.maxMessages = DEFAULT_MAX_MESSAGES;
  }
  if (!type.isInt(subscription.client.maxMessages) || subscription.client.maxMessages < 1) {
    throw new ConfigError(
      `Subscription "${subscription.id}" at page "${pageId}" client.maxMessages should be a positive integer.`,
      { received: subscription.client.maxMessages, configKey }
    );
  }
  if (type.isNone(subscription.client.throttleRender)) {
    subscription.client.throttleRender = DEFAULT_THROTTLE_RENDER;
  }
  if (!type.isNumber(subscription.client.throttleRender)) {
    throw new ConfigError(
      `Subscription "${subscription.id}" at page "${pageId}" client.throttleRender should be a number.`,
      { received: subscription.client.throttleRender, configKey }
    );
  }
  if (subscription.client.throttleRender < MIN_THROTTLE_RENDER) {
    context.handleWarning(
      new ConfigWarning(
        `Subscription "${subscription.id}" at page "${pageId}" client.throttleRender is below the minimum of ${MIN_THROTTLE_RENDER}ms and will be clamped.`,
        { configKey }
      )
    );
    subscription.client.throttleRender = MIN_THROTTLE_RENDER;
  }

  if (type.isNone(subscription.events)) {
    subscription.events = {};
  }
  Object.keys(subscription.events).forEach((eventName) => {
    if (eventName.startsWith('~')) return;
    if (!SUBSCRIPTION_EVENTS.includes(eventName)) {
      context.handleWarning(
        new ConfigWarning(
          `Subscription "${subscription.id}" at page "${pageId}" has event "${eventName}" which will never fire. Supported events: ${SUBSCRIPTION_EVENTS.join(', ')}.`,
          { configKey: subscription.events[eventName]?.['~k'] ?? configKey }
        )
      );
    }
  });

  // Reuse the block event builder — normalizes actions to { try, catch },
  // validates action ids, counts action types, and collects Request action
  // refs so subscription events can trigger page requests.
  buildEvents(
    {
      blockId: `subscription:${subscription.id}`,
      events: subscription.events,
      '~k': configKey,
    },
    pageContext
  );

  // Subscriptions are extracted from the page before buildBlock runs, so
  // countBlockOperators never sees them — count client operators here.
  // Payload and event action params are both evaluated client-side.
  countOperators(
    { events: subscription.events, payload: subscription.payload },
    { counter: pageContext.typeCounters.operators.client }
  );

  subscription.websocketId = subscription.id;
  subscription.pageId = pageId;
  subscription.id = `subscription:${pageId}:${subscription.websocketId}`;
}

function buildSubscriptions(page, pageContext) {
  if (type.isNone(page.subscriptions)) {
    page.subscriptions = [];
  }
  if (!type.isArray(page.subscriptions)) {
    throw new ConfigError(`Subscriptions is not an array at page "${pageContext.pageId}".`, {
      received: page.subscriptions,
      configKey: page['~k'],
    });
  }
  pageContext.checkDuplicateSubscriptionId = createCheckDuplicateId({
    message: 'Duplicate subscription "{{ id }}" on page "{{ pageId }}".',
  });
  page.subscriptions.forEach((subscription) => {
    buildSubscription({ subscription, pageContext });
  });
}

export default buildSubscriptions;
