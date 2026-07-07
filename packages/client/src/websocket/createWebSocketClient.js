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

  // websocketId → { payload, handlers }
  const subscriptions = new Map();
  // websocketId → { resolve, reject, timer } for pending subscribe acks
  const pendingSubscribes = new Map();
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
    const apiBase = lowdefy.apiBase ?? lowdefy.basePath ?? '';
    // An absolute apiBase (mobile app → remote server) carries its own origin.
    if (/^https?:\/\//.test(apiBase)) {
      return `${apiBase.replace(/^http/, 'ws')}/api/websocket`;
    }
    const { location } = window;
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${location.host}${apiBase}/api/websocket`;
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

  function send(frame) {
    const message = JSON.stringify(frame);
    if (socket && socket.readyState === window.WebSocket.OPEN) {
      socket.send(message);
      return;
    }
    sendQueue.push(message);
    connect();
  }

  function flushQueue() {
    while (sendQueue.length > 0 && socket && socket.readyState === window.WebSocket.OPEN) {
      socket.send(sendQueue.shift());
    }
  }

  function resubscribeAll() {
    subscriptions.forEach(({ payload }, websocketId) => {
      socket.send(JSON.stringify({ type: 'subscribe', websocketId, payload }));
    });
  }

  function handleFrame(frame) {
    const { message, payload, requestId, websocketId } = frame;
    const subscription = subscriptions.get(websocketId);
    switch (frame.type) {
      case 'message':
        subscription?.handlers.onMessage(payload);
        return;
      case 'subscribed': {
        const pending = pendingSubscribes.get(websocketId);
        if (pending) {
          clearTimeout(pending.timer);
          pendingSubscribes.delete(websocketId);
          pending.resolve();
        }
        subscription?.handlers.onConnected();
        return;
      }
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
        const error = new Error(message ?? 'WebSocket error.');
        if (requestId && pendingPublishes.has(requestId)) {
          const pending = pendingPublishes.get(requestId);
          clearTimeout(pending.timer);
          pendingPublishes.delete(requestId);
          pending.reject(error);
          return;
        }
        if (websocketId && pendingSubscribes.has(websocketId)) {
          const pending = pendingSubscribes.get(websocketId);
          clearTimeout(pending.timer);
          pendingSubscribes.delete(websocketId);
          subscriptions.delete(websocketId);
          pending.reject(error);
          return;
        }
        if (subscription) {
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
    subscriptions.forEach(({ handlers }) => {
      handlers.onDisconnected();
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
          reject(new Error('WebSocket connection failed.'));
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
    subscriptions.set(websocketId, { handlers, payload });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingSubscribes.delete(websocketId);
        subscriptions.delete(websocketId);
        reject(new Error(`Subscribe to "${websocketId}" timed out.`));
      }, ACK_TIMEOUT_MS);
      pendingSubscribes.set(websocketId, { resolve, reject, timer });
      send({ type: 'subscribe', websocketId, payload });
    });
  }

  function unsubscribe({ websocketId }) {
    if (!subscriptions.has(websocketId)) {
      return;
    }
    subscriptions.delete(websocketId);
    if (socket && socket.readyState === window.WebSocket.OPEN) {
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
        reject(new Error(`Publish to "${websocketId}" timed out.`));
      }, ACK_TIMEOUT_MS);
      pendingPublishes.set(requestId, { resolve, reject, timer });
      send({ type: 'publish', websocketId, requestId, payload });
    });
  }

  return { connect, publish, subscribe, unsubscribe };
}

export default createWebSocketClient;
