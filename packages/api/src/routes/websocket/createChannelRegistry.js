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

import crypto from 'crypto';
import { serializer } from '@lowdefy/helpers';
import { ConfigError, PluginError, ServiceError } from '@lowdefy/errors';

import prepareChannel from './prepareChannel.js';

const MAX_RETRIES = 5;
const RETRY_BASE_MS = 1000;
const HEALTHY_RESET_MS = 60 * 1000;

// One registry per server process. The unit of sharing is the evaluated
// subscription: subscribers whose evaluated connection and websocket
// properties are identical join the same channel entry and share one running
// source resolver. Sources start on the first subscriber and stop when the
// last one leaves.
function createChannelRegistry() {
  const channels = new Map();

  function getChannelKey({ connectionProperties, properties, tenant, websocketId }) {
    // The tenant verdict is part of the channel identity: two callers whose
    // evaluated properties are identical but whose organizations differ must
    // never share a running source, or one org would receive the other's
    // change events.
    const hash = crypto
      .createHash('sha1')
      .update(serializer.serializeToString({ connectionProperties, properties, tenant }))
      .digest('base64');
    return `${websocketId}:${hash}`;
  }

  function broadcast(channel, frame) {
    const message = JSON.stringify(frame);
    channel.subscribers.forEach((subscriber) => {
      subscriber.send(message);
    });
  }

  function wrapResolverError({ channel, error }) {
    if (!error.configKey) {
      error.configKey = channel.websocketConfig['~k'];
    }
    if (error.isLowdefyError) {
      return error;
    }
    if (ServiceError.isServiceError(error)) {
      return new ServiceError(undefined, {
        cause: error,
        service: channel.websocketConfig.connectionId ?? channel.websocketConfig.type,
        configKey: channel.websocketConfig['~k'],
      });
    }
    return new PluginError(error.message, {
      cause: error,
      typeName: channel.websocketConfig.type,
      received: channel.properties,
      location: channel.websocketConfig.websocketId,
      configKey: channel.websocketConfig['~k'],
    });
  }

  function removeChannel(channel) {
    if (channel.restartTimer) {
      clearTimeout(channel.restartTimer);
      channel.restartTimer = null;
    }
    channel.abortController?.abort();
    channels.delete(channel.key);
  }

  function handleResolverError({ channel, error, startedAt }) {
    if (channel.abortController?.signal.aborted) {
      // Errors thrown while winding down are expected (closed cursors, etc).
      channel.logger.debug(
        { event: 'ws_source_stopped_error_ignored', websocketId: channel.websocketId },
        error.message
      );
      return;
    }
    const wrapped = wrapResolverError({ channel, error });
    channel.logger.debug({ err: wrapped }, wrapped.message);
    channel.context.handleError(wrapped);
    broadcast(channel, {
      type: 'error',
      websocketId: channel.websocketId,
      message: wrapped.message,
    });

    // A run that stayed healthy resets the backoff window.
    if (Date.now() - startedAt > HEALTHY_RESET_MS) {
      channel.retryCount = 0;
    }
    if (channel.retryCount >= MAX_RETRIES) {
      channel.logger.error({
        event: 'ws_source_max_retries',
        websocketId: channel.websocketId,
      });
      removeChannel(channel);
      return;
    }
    const delay = RETRY_BASE_MS * 2 ** channel.retryCount;
    channel.retryCount += 1;
    channel.restartTimer = setTimeout(() => {
      channel.restartTimer = null;
      // Subscribers may all have left while the restart was pending.
      if (channel.subscribers.size === 0) {
        removeChannel(channel);
        return;
      }
      channel.logger.info({
        event: 'ws_source_restart',
        websocketId: channel.websocketId,
        retryCount: channel.retryCount,
      });
      startResolver(channel);
    }, delay);
  }

  function startResolver(channel) {
    const abortController = new AbortController();
    channel.abortController = abortController;
    const startedAt = Date.now();

    function publish({ data }) {
      if (abortController.signal.aborted) {
        return;
      }
      broadcast(channel, {
        type: 'message',
        websocketId: channel.websocketId,
        payload: serializer.serialize({ data }),
      });
    }
    channel.publish = publish;

    Promise.resolve()
      .then(() =>
        channel.resolver({
          connection: channel.connectionProperties,
          properties: channel.properties,
          publish,
          signal: abortController.signal,
          logger: channel.logger,
          tenant: channel.tenant ?? null,
        })
      )
      .catch((error) => handleResolverError({ channel, error, startedAt }));
  }

  async function subscribe(context, { websocketId, payload, subscriber }) {
    const { connectionProperties, properties, tenant, websocketConfig, websocketResolver } =
      await prepareChannel(context, { websocketId, payload });

    // One subscription per websocketId per connection — a re-subscribe (e.g.
    // with a new payload) replaces the previous one.
    if (subscriber.subscriptions.has(websocketId)) {
      unsubscribe({ websocketId, subscriber });
    }

    const key = getChannelKey({ connectionProperties, properties, tenant, websocketId });
    let channel = channels.get(key);
    if (!channel) {
      channel = {
        key,
        websocketId,
        websocketConfig,
        resolver: websocketResolver,
        connectionProperties,
        properties,
        tenant,
        subscribers: new Set(),
        abortController: null,
        restartTimer: null,
        retryCount: 0,
        publish: null,
        context,
        logger: context.logger,
      };
      channels.set(key, channel);
      startResolver(channel);
    }
    channel.subscribers.add(subscriber);
    subscriber.subscriptions.set(websocketId, key);
    context.logger.debug({
      event: 'ws_subscribe',
      websocketId,
      subscribers: channel.subscribers.size,
    });
  }

  function unsubscribe({ websocketId, subscriber }) {
    const key = subscriber.subscriptions.get(websocketId);
    subscriber.subscriptions.delete(websocketId);
    if (!key) {
      return;
    }
    const channel = channels.get(key);
    if (!channel) {
      return;
    }
    channel.subscribers.delete(subscriber);
    if (channel.subscribers.size === 0) {
      removeChannel(channel);
    }
  }

  function unsubscribeAll({ subscriber }) {
    [...subscriber.subscriptions.keys()].forEach((websocketId) => {
      unsubscribe({ websocketId, subscriber });
    });
  }

  async function publish(context, { websocketId, payload }) {
    // Publish identity is evaluated without a subscription payload — channels
    // that fragment on _payload/_user in properties are not publish targets.
    const { connectionProperties, properties, tenant, websocketConfig, websocketResolver } =
      await prepareChannel(context, { websocketId, payload: {} });

    if (websocketResolver.meta?.publish !== true || properties.publish !== true) {
      throw new ConfigError(`Websocket "${websocketId}" does not allow publishing.`, {
        configKey: websocketConfig['~k'],
      });
    }

    const key = getChannelKey({ connectionProperties, properties, tenant, websocketId });
    const channel = channels.get(key);
    // No channel means no subscribers on this instance — the publish is
    // accepted and simply reaches nobody here.
    if (!channel?.publish) {
      return;
    }
    const data = serializer.deserialize(payload);
    if (typeof websocketResolver.onPublish === 'function') {
      await websocketResolver.onPublish({
        data,
        properties,
        publish: channel.publish,
        user: context.user,
      });
      return;
    }
    channel.publish({ data });
  }

  return {
    publish,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    // Exposed for tests and shutdown.
    channels,
  };
}

export default createChannelRegistry;
