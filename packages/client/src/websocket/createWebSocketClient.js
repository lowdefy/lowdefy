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

import { decodeServerError } from '@lowdefy/engine';
import { ServiceError } from '@lowdefy/errors';

const ACK_TIMEOUT_MS = 10 * 1000;
const IDLE_CLOSE_GRACE_MS = 5 * 1000;
const RECONNECT_BASE_MS = 500;
const RECONNECT_CAP_MS = 15 * 1000;

// One websocket per browser tab, shared by all channels, created lazily on
// the first subscribe or publish. Connections are ephemeral in production
// (serverless platforms close them at function max duration), so reconnect
// with backoff and resubscribe is the steady state, not an edge case.
function createWebSocketClient(lowdefy) {
  const { window } = lowdefy._internal.globals;

  // websocketId → { websocketId, payload, handlers, ackTimer, pending }
  // ackTimer runs while a subscribe frame waits for its ack. pending holds the
  // subscribe promise's { resolve, reject } until the first ack, then is null.
  const subscriptions = new Map();
  // requestId → { resolve, reject, timer } for pending publish acks
  const pendingPublishes = new Map();
  // Frames queued while the socket is (re)connecting.
  const sendQueue = [];

  let socket = null;
  let openPromise = null;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let idleTimer = null;
  let closedByClient = false;
  let publishCounter = 0;

  function url() {
    const { location } = window;
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${location.host}${lowdefy.basePath ?? ''}/api/websocket`;
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function scheduleIdleClose() {
    clearIdleTimer();
    if (subscriptions.size > 0) {
      return;
    }
    // Grace period so rapid page navigation doesn't thrash connections.
    idleTimer = setTimeout(() => {
      if (subscriptions.size === 0 && socket) {
        closedByClient = true;
        socket.close();
        socket = null;
        openPromise = null;
      }
    }, IDLE_CLOSE_GRACE_MS);
  }

  function isSocketOpen() {
    return socket !== null && socket.readyState === window.WebSocket.OPEN;
  }

  function send(frame) {
    const message = JSON.stringify(frame);
    if (isSocketOpen()) {
      socket.send(message);
      return;
    }
    sendQueue.push(message);
    connect();
  }

  function flushQueue() {
    while (sendQueue.length > 0 && isSocketOpen()) {
      socket.send(sendQueue.shift());
    }
  }

  function clearAckTimer(subscription) {
    clearTimeout(subscription.ackTimer);
    subscription.ackTimer = null;
  }

  function handleAckTimeout(subscription) {
    subscription.ackTimer = null;
    const error = new ServiceError(`Subscribe to "${subscription.websocketId}" timed out.`, {
      service: 'WebSocket',
    });
    if (subscription.pending) {
      subscriptions.delete(subscription.websocketId);
      subscription.pending.reject(error);
      return;
    }
    subscription.handlers.onError(error.message);
  }

  // Every path that removes a subscription from the map or answers its
  // subscribe clears this timer, so a timer that fires always belongs to the
  // subscription currently in the map.
  function startAckTimer(subscription) {
    clearAckTimer(subscription);
    subscription.ackTimer = setTimeout(() => handleAckTimeout(subscription), ACK_TIMEOUT_MS);
  }

  function sendSubscribe(subscription) {
    const { payload, websocketId } = subscription;
    startAckTimer(subscription);
    socket.send(JSON.stringify({ type: 'subscribe', websocketId, payload }));
  }

  // A caller that unsubscribed, or whose subscribe was replaced by a newer one
  // to the same feed, no longer wants this subscription, so its subscribe
  // promise settles without an error.
  function releaseSubscription(subscription) {
    clearAckTimer(subscription);
    if (subscription.pending) {
      subscription.pending.resolve();
      subscription.pending = null;
    }
  }

  function resubscribeAll() {
    subscriptions.forEach(sendSubscribe);
  }

  function handleFrame(frame) {
    const { error: errorPayload, message, payload, requestId, websocketId } = frame;
    const subscription = subscriptions.get(websocketId);
    switch (frame.type) {
      case 'message':
        subscription?.handlers.onMessage(payload);
        return;
      case 'subscribed':
        if (!subscription) {
          return;
        }
        clearAckTimer(subscription);
        if (subscription.pending) {
          subscription.pending.resolve();
          subscription.pending = null;
        }
        subscription.handlers.onConnected();
        return;
      case 'unsubscribed':
        return;
      case 'published': {
        const pending = pendingPublishes.get(requestId);
        if (pending) {
          clearTimeout(pending.timer);
          pendingPublishes.delete(requestId);
          pending.resolve();
        }
        return;
      }
      case 'error': {
        // Reply frames carry the error payload; broadcasts and frame-format
        // errors carry only a message string.
        const error = errorPayload
          ? decodeServerError(errorPayload)
          : new ServiceError(message ?? 'WebSocket error.', { service: 'WebSocket' });
        if (requestId && pendingPublishes.has(requestId)) {
          const pending = pendingPublishes.get(requestId);
          clearTimeout(pending.timer);
          pendingPublishes.delete(requestId);
          pending.reject(error);
          return;
        }
        if (subscription) {
          // An error frame for a feed whose subscribe waits for an ack answers that subscribe.
          clearAckTimer(subscription);
          if (subscription.pending) {
            subscriptions.delete(websocketId);
            subscription.pending.reject(error);
            return;
          }
          subscription.handlers.onError(error.message);
          return;
        }
        lowdefy._internal.logger.warn(error);
        return;
      }
      default:
      // Unknown frame types are ignored for forward compatibility.
    }
  }

  function handleClose() {
    socket = null;
    openPromise = null;
    subscriptions.forEach((subscription) => {
      // A resubscribe lost with the connection is sent again, with a new ack
      // timer, when the connection reopens. A subscribe whose caller still
      // waits keeps its timer, so it fails if no connection opens in time.
      if (!subscription.pending) {
        clearAckTimer(subscription);
      }
      subscription.handlers.onDisconnected();
    });
    if (closedByClient) {
      closedByClient = false;
      return;
    }
    if (subscriptions.size === 0 && sendQueue.length === 0) {
      return;
    }
    // Capped exponential backoff with full jitter.
    const base = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_CAP_MS);
    const delay = Math.random() * base;
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function connect() {
    if (openPromise) {
      return openPromise;
    }
    clearIdleTimer();
    openPromise = new Promise((resolve, reject) => {
      const ws = new window.WebSocket(url());
      ws.onopen = () => {
        socket = ws;
        reconnectAttempt = 0;
        resubscribeAll();
        flushQueue();
        resolve();
      };
      ws.onmessage = (event) => {
        let frame;
        try {
          frame = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        handleFrame(frame);
      };
      ws.onclose = () => {
        if (socket !== ws) {
          // Never opened — treat as a failed connect and retry.
          openPromise = null;
          reject(new ServiceError('Connection failed.', { service: 'WebSocket' }));
        }
        handleClose();
      };
      ws.onerror = () => {
        // onclose always follows onerror — reconnect is handled there.
      };
    });
    // Connection errors surface through subscribe/publish ack timeouts.
    openPromise.catch(() => {});
    return openPromise;
  }

  function subscribe({ handlers, payload, websocketId }) {
    clearIdleTimer();
    const previous = subscriptions.get(websocketId);
    if (previous) {
      releaseSubscription(previous);
    }
    return new Promise((resolve, reject) => {
      const subscription = {
        websocketId,
        payload,
        handlers,
        ackTimer: null,
        pending: { resolve, reject },
      };
      subscriptions.set(websocketId, subscription);
      if (isSocketOpen()) {
        sendSubscribe(subscription);
        return;
      }
      // The frame is sent by resubscribeAll when the connection opens, which
      // restarts the ack timer. Until then the timer bounds the wait for a
      // connection.
      startAckTimer(subscription);
      connect();
    });
  }

  function unsubscribe({ websocketId }) {
    const subscription = subscriptions.get(websocketId);
    if (!subscription) {
      return;
    }
    releaseSubscription(subscription);
    subscriptions.delete(websocketId);
    if (isSocketOpen()) {
      socket.send(JSON.stringify({ type: 'unsubscribe', websocketId }));
    }
    scheduleIdleClose();
  }

  function publish({ payload, websocketId }) {
    publishCounter += 1;
    const requestId = `p${publishCounter}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingPublishes.delete(requestId);
        reject(
          new ServiceError(`Publish to "${websocketId}" timed out.`, { service: 'WebSocket' })
        );
      }, ACK_TIMEOUT_MS);
      pendingPublishes.set(requestId, { resolve, reject, timer });
      send({ type: 'publish', websocketId, requestId, payload });
    });
  }

  return { connect, publish, subscribe, unsubscribe };
}

export default createWebSocketClient;
