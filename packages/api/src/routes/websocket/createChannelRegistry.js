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
import { serializer, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import checkWebsocketAccess from './checkWebsocketAccess.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import createWireProjection from '../../response/createWireProjection.js';
import prepareChannel from './prepareChannel.js';
import wrapResolverError from '../request/wrapResolverError.js';

// A failed source is restarted for as long as its channel has subscribers, 1 s
// after the first failure, doubling up to 60 s apart.
const RETRY_BASE_MS = 1000;
const RETRY_CAP_MS = 60 * 1000;
const HEALTHY_RESET_MS = 60 * 1000;

// One registry per server process. The unit of sharing is the evaluated
// subscription: subscribers whose evaluated connection and websocket
// properties are identical join the same channel entry and share one running
// source resolver. Sources start on the first subscriber and stop when the
// last one leaves.
function createChannelRegistry() {
  const channels = new Map();
  // subscriber → (websocketId → { payload, websocketConfig }) for the open
  // subscriptions whose websocket has a check, so the check can run again while
  // they stay open (recheckAccess).
  const checkedSubscriptions = new WeakMap();

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

  // Config reads a broadcast error only as a message string, so it gets the wire
  // message alone - no requestId, since no single request raised it, and no
  // devError, since the dev terminal already logs it in full. The channel's
  // context belongs to whoever subscribed first, so the message is translated
  // with each subscriber's own locale.
  function broadcastError(channel, error) {
    channel.subscribers.forEach((subscriber) => {
      const { message } = createWireProjection({ i18n: subscriber.i18n })(error);
      subscriber.send(JSON.stringify({ type: 'error', websocketId: channel.websocketId, message }));
    });
  }

  // Wrapped like a request step's error: the evaluated properties stay out of it, and the
  // source's own error is summarised, since both are logged and sent to Sentry.
  function wrapSourceError({ channel, error }) {
    if (!error.configKey) {
      error.configKey = channel.websocketConfig['~k'];
    }
    if (error.isLowdefyError) {
      return error;
    }
    return wrapResolverError(error, {
      configKey: channel.websocketConfig['~k'],
      fields: { connectionId: channel.websocketConfig.connectionId },
      location: channel.websocketConfig.websocketId,
      service: channel.websocketConfig.connectionId ?? channel.websocketConfig.type,
      typeName: channel.websocketConfig.type,
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

  function handleResolverError({ channel, error, run }) {
    if (run.abortController.signal.aborted) {
      // Errors thrown while winding down are expected (closed cursors, etc).
      channel.logger.debug(
        { event: 'ws_source_stopped_error_ignored', websocketId: channel.websocketId },
        error.message
      );
      return;
    }
    // Anything the failed run left behind can no longer publish or report it is ready.
    run.abortController.abort();
    const wrapped = wrapSourceError({ channel, error });
    channel.logger.debug({ err: wrapped }, wrapped.message);

    // A run that stayed ready this long was healthy, and resets the backoff. Time
    // spent starting does not count: a source waiting on an unreachable database
    // can take a minute to fail.
    if (run.readyAt !== null && Date.now() - run.readyAt > HEALTHY_RESET_MS) {
      channel.retryCount = 0;
    }
    const delay = Math.min(RETRY_BASE_MS * 2 ** channel.retryCount, RETRY_CAP_MS);
    // An outage lasts from the source's first failure until it is ready again, and
    // is reported once: the restarts that fail during it are warnings.
    if (channel.failing) {
      channel.logger.warn(
        {
          event: 'ws_source_restart_failed',
          websocketId: channel.websocketId,
          retryCount: channel.retryCount,
          retryInMs: delay,
        },
        wrapped.message
      );
    } else {
      channel.failing = true;
      channel.context.handleError(wrapped);
    }
    broadcastError(channel, wrapped);
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
    const run = { abortController, readyAt: null };

    // A source calls ready once it is listening, and a publish shows it is. The
    // source heard nothing while it was down, so after an outage each subscriber
    // gets a subscribed frame for its subscribe, which fires the page's
    // onSubscribe for it to fetch what it missed.
    function ready() {
      if (abortController.signal.aborted) {
        return;
      }
      run.readyAt ??= Date.now();
      if (!channel.failing) {
        return;
      }
      channel.failing = false;
      channel.logger.info({ event: 'ws_source_recovered', websocketId: channel.websocketId });
      channel.subscribers.forEach((subscriber) => {
        subscriber.send(
          JSON.stringify({
            type: 'subscribed',
            websocketId: channel.websocketId,
            requestId: channel.subscribeRequestIds.get(subscriber),
          })
        );
      });
    }

    function publish({ data }) {
      if (abortController.signal.aborted) {
        return;
      }
      ready();
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
          ready,
          signal: abortController.signal,
          logger: channel.logger,
          tenant: channel.tenant ?? null,
        })
      )
      .catch((error) => handleResolverError({ channel, error, run }));
  }

  async function subscribe(context, { websocketId, payload, requestId, subscriber }) {
    // One subscription per websocketId per connection — a re-subscribe (e.g.
    // with a new payload) replaces the previous one. The client stops reading
    // the previous one when it sends the re-subscribe, so it is removed before
    // the new one is prepared: a re-subscribe that fails leaves nothing open.
    if (subscriber.subscriptions.has(websocketId)) {
      unsubscribe({ websocketId, subscriber });
    }

    // The client serializes the payload, as it does for a publish and a CallAPI,
    // so properties and the check endpoint read Dates as Dates.
    const deserializedPayload = serializer.deserialize(payload ?? {});
    const { connectionProperties, properties, tenant, websocketConfig, websocketResolver } =
      await prepareChannel(context, { websocketId, payload: deserializedPayload });

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
        // subscriber → the requestId of the subscribe that joined it. The client
        // reads a subscribed frame with any other requestId as a reply to a
        // subscribe it has since replaced, and ignores it.
        subscribeRequestIds: new Map(),
        abortController: null,
        restartTimer: null,
        retryCount: 0,
        failing: false,
        publish: null,
        context,
        logger: context.logger,
      };
      channels.set(key, channel);
      startResolver(channel);
    }
    channel.subscribers.add(subscriber);
    channel.subscribeRequestIds.set(subscriber, requestId);
    subscriber.subscriptions.set(websocketId, key);
    if (!type.isNone(websocketConfig.check)) {
      if (!checkedSubscriptions.has(subscriber)) {
        checkedSubscriptions.set(subscriber, new Map());
      }
      checkedSubscriptions
        .get(subscriber)
        .set(websocketId, { payload: deserializedPayload, websocketConfig });
    }
    context.logger.debug({
      event: 'ws_subscribe',
      websocketId,
      subscribers: channel.subscribers.size,
    });
  }

  function unsubscribe({ websocketId, subscriber }) {
    const key = subscriber.subscriptions.get(websocketId);
    subscriber.subscriptions.delete(websocketId);
    checkedSubscriptions.get(subscriber)?.delete(websocketId);
    if (!key) {
      return;
    }
    const channel = channels.get(key);
    if (!channel) {
      return;
    }
    channel.subscribers.delete(subscriber);
    channel.subscribeRequestIds.delete(subscriber);
    if (channel.subscribers.size === 0) {
      removeChannel(channel);
    }
  }

  function unsubscribeAll({ subscriber }) {
    [...subscriber.subscriptions.keys()].forEach((websocketId) => {
      unsubscribe({ websocketId, subscriber });
    });
  }

  function getCheckedWebsocketIds({ subscriber }) {
    return [...(checkedSubscriptions.get(subscriber)?.keys() ?? [])];
  }

  // Access to a record can be revoked while a subscription to it stays open, so
  // the connection runs the check again on its periodic caller check, with the
  // payload and config the subscription was opened with. A refused
  // subscription is closed and the refusal thrown for the caller to be told.
  // The subscription may have been closed while this waited in its feed queue.
  async function recheckAccess(context, { websocketId, subscriber }) {
    const subscription = checkedSubscriptions.get(subscriber)?.get(websocketId);
    if (type.isUndefined(subscription)) {
      return;
    }
    context.evaluateOperators = createEvaluateOperators(context);
    try {
      await checkWebsocketAccess(context, subscription);
    } catch (error) {
      unsubscribe({ websocketId, subscriber });
      throw error;
    }
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
    getCheckedWebsocketIds,
    publish,
    recheckAccess,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    // Exposed for tests and shutdown.
    channels,
  };
}

export default createChannelRegistry;
