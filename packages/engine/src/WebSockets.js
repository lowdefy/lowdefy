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

import { ConfigError, ServiceError } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

import Events from './Events.js';

const DEFAULT_MAX_MESSAGES = 100;
const DEFAULT_THROTTLE_RENDER = 250;
const MIN_THROTTLE_RENDER = 100;

class WebSockets {
  constructor(context) {
    this.context = context;
    this.subscriptionConfig = {};
    this.subscriptionEvents = {};
    this.buffers = {};
    this.flushTimers = {};
    this.active = new Set();

    this.publish = this.publish.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.subscribeAll = this.subscribeAll.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.unsubscribeAll = this.unsubscribeAll.bind(this);

    this.context.websockets = {};
    (this.context._internal.rootBlock.subscriptions ?? []).forEach((subscription) => {
      this.subscriptionConfig[subscription.websocketId] = subscription;
      this.initChannelState(subscription.websocketId);
    });
  }

  client() {
    return this.context._internal.lowdefy._internal.websocketClient;
  }

  initChannelState(websocketId) {
    this.context.websockets[websocketId] = {
      connected: false,
      error: null,
      lastMessage: null,
      messageCount: 0,
      messages: [],
    };
  }

  getEvents(websocketId, config) {
    if (!this.subscriptionEvents[websocketId]) {
      this.subscriptionEvents[websocketId] = new Events({
        arrayIndices: [],
        block: {
          blockId: `subscription:${websocketId}`,
          events: config.events ?? {},
        },
        context: this.context,
      });
    }
    return this.subscriptionEvents[websocketId];
  }

  flush({ websocketId, maxMessages }) {
    const buffer = this.buffers[websocketId];
    const channel = this.context.websockets[websocketId];
    if (!buffer || buffer.length === 0 || !channel) {
      return;
    }
    const batch = buffer.splice(0, buffer.length);
    channel.messages.push(...batch);
    if (channel.messages.length > maxMessages) {
      channel.messages.splice(0, channel.messages.length - maxMessages);
    }
    channel.lastMessage = batch[batch.length - 1];
    channel.messageCount += batch.length;
    this.context._internal.update();
    this.subscriptionEvents[websocketId]?.triggerEvent({
      name: 'onMessage',
      event: { messages: batch },
    });
  }

  handleMessage({ websocketId, maxMessages, serializedPayload, throttleMs }) {
    if (!this.active.has(websocketId)) {
      return;
    }
    const data = serializer.deserialize(serializedPayload)?.data;
    this.buffers[websocketId].push(data);
    // Leading-edge throttle: the first message in a window renders
    // immediately, the rest batch until the window closes.
    if (!this.flushTimers[websocketId]) {
      this.flush({ websocketId, maxMessages });
      const arm = () => {
        this.flushTimers[websocketId] = setTimeout(() => {
          if ((this.buffers[websocketId] ?? []).length > 0) {
            this.flush({ websocketId, maxMessages });
            arm();
            return;
          }
          this.flushTimers[websocketId] = null;
        }, throttleMs);
      };
      arm();
    }
  }

  async subscribe({ actions, arrayIndices, event, websocketId }) {
    if (!type.isString(websocketId)) {
      throw new Error('Subscribe requires a websocketId.');
    }
    if (this.active.has(websocketId)) {
      return;
    }
    const config = this.subscriptionConfig[websocketId];
    if (type.isNone(config)) {
      throw new ConfigError(`Subscription "${websocketId}" is not defined on this page.`);
    }

    const { output: payload, errors: parserErrors } = this.context._internal.parser.parse({
      actions,
      arrayIndices,
      event,
      input: config.payload ?? {},
      location: `subscription:${websocketId}`,
    });
    if (parserErrors.length > 0) {
      throw parserErrors[0];
    }

    const events = this.getEvents(websocketId, config);
    const channel = this.context.websockets[websocketId];
    const throttleMs = Math.max(
      config.client?.throttleRender ?? DEFAULT_THROTTLE_RENDER,
      MIN_THROTTLE_RENDER
    );
    const maxMessages = config.client?.maxMessages ?? DEFAULT_MAX_MESSAGES;

    this.active.add(websocketId);
    this.buffers[websocketId] = [];

    try {
      await this.client().subscribe({
        websocketId,
        payload: serializer.serialize(payload),
        handlers: {
          onConnected: () => {
            channel.connected = true;
            channel.error = null;
            this.context._internal.update();
            events.triggerEvent({ name: 'onSubscribe', event: {} });
          },
          onDisconnected: () => {
            channel.connected = false;
            this.context._internal.update();
          },
          onError: (message) => {
            channel.error = { message };
            this.context._internal.update();
            events.triggerEvent({ name: 'onError', event: { message } });
          },
          onMessage: (serializedPayload) => {
            this.handleMessage({ websocketId, maxMessages, serializedPayload, throttleMs });
          },
        },
      });
    } catch (error) {
      this.active.delete(websocketId);
      channel.error = { message: error.message };
      this.context._internal.update();
      if (error.isLowdefyError) {
        throw error;
      }
      throw new ServiceError(undefined, { cause: error, service: 'WebSocket' });
    }
  }

  subscribeAll() {
    Object.keys(this.subscriptionConfig).forEach((websocketId) => {
      this.subscribe({ websocketId }).catch((error) => {
        this.context._internal.lowdefy._internal.handleError(error);
      });
    });
  }

  unsubscribe({ websocketId }) {
    if (!type.isString(websocketId)) {
      throw new Error('Unsubscribe requires a websocketId.');
    }
    if (!this.active.has(websocketId)) {
      return;
    }
    this.active.delete(websocketId);
    if (this.flushTimers[websocketId]) {
      clearTimeout(this.flushTimers[websocketId]);
      this.flushTimers[websocketId] = null;
    }
    this.buffers[websocketId] = [];
    this.client().unsubscribe({ websocketId });
    this.initChannelState(websocketId);
    this.context._internal.update();
  }

  unsubscribeAll() {
    [...this.active].forEach((websocketId) => {
      this.unsubscribe({ websocketId });
    });
  }

  async publish({ payload, websocketId }) {
    if (!type.isString(websocketId)) {
      throw new Error('Publish requires a websocketId.');
    }
    await this.client().publish({
      websocketId,
      payload: serializer.serialize(payload ?? {}),
    });
  }
}

export default WebSockets;
