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

const NEXT_READ_KINDS = ['scan', 'photo', 'nfc', 'transcript'];
const PERMISSION_ANSWERS = ['granted', 'denied'];
const NETWORK_STATES = ['online', 'offline'];
const KINDS = [...NEXT_READ_KINDS, 'location', 'permission', 'network', 'push', 'clear'];

function describe(value) {
  return JSON.stringify(value);
}

function isTranscript(value) {
  if (!type.isObject(value)) {
    return false;
  }
  if (!type.isUndefined(value.error)) {
    return type.isString(value.error) && value.error !== '';
  }
  return (
    type.isString(value.final) &&
    (type.isUndefined(value.partials) ||
      (type.isArray(value.partials) && value.partials.every(type.isString)))
  );
}

function isLocation(value) {
  return type.isObject(value) && type.isNumber(value.latitude) && type.isNumber(value.longitude);
}

// Checks one injection's value, throwing the message the agent gets back.
function validateInjection({ kind, name, value }) {
  if (!KINDS.includes(kind)) {
    throw new Error(`An injection kind is one of ${KINDS.join(', ')}. Received ${describe(kind)}.`);
  }
  if (kind === 'push') {
    throw new Error(
      'Push injection needs expo-notifications to show a local notification, and Lowdefy Dev does not include it yet.'
    );
  }
  if (kind === 'scan' && !(type.isObject(value) && type.isString(value.data))) {
    throw new Error(`A scan injection needs { data }. Received ${describe(value)}.`);
  }
  if (kind === 'photo' && !(type.isObject(value) && type.isString(value.base64))) {
    throw new Error(`A photo injection needs { base64 }. Received ${describe(value)}.`);
  }
  if (kind === 'nfc' && !type.isObject(value)) {
    throw new Error(
      `An nfc injection needs the tag read as an object. Received ${describe(value)}.`
    );
  }
  if (kind === 'transcript' && !isTranscript(value)) {
    throw new Error(
      `A transcript injection needs { final } with optional { partials } (a list of strings), or { error }. Received ${describe(
        value
      )}.`
    );
  }
  if (kind === 'location') {
    const route = type.isArray(value) ? value : [value];
    if (route.length === 0 || !route.every(isLocation)) {
      throw new Error(
        `A location injection needs { latitude, longitude }, or a route as a list of them. Received ${describe(
          value
        )}.`
      );
    }
  }
  if (kind === 'permission') {
    if (!type.isString(name) || name === '') {
      throw new Error(
        `A permission injection needs the permission's name. Received ${describe(name)}.`
      );
    }
    if (!PERMISSION_ANSWERS.includes(value)) {
      throw new Error(`A permission answer is "granted" or "denied". Received ${describe(value)}.`);
    }
  }
  if (kind === 'network' && !NETWORK_STATES.includes(value)) {
    throw new Error(`A network injection is "online" or "offline". Received ${describe(value)}.`);
  }
}

/**
 * The device results an agent or journey told Lowdefy Dev to fake, through the dev-tab client's
 * `inject` requests. Device actions read them with `injected(name)` (src/device/injected.js), which
 * calls take.
 *
 * - `scan`, `photo` and `nfc` queue: each read takes the next one, and none is left once taken.
 * - `transcript` queues the same way: each dictation session takes the next one and "hears" its
 *   `partials`, then its `final`, or ends with its `error` (blocks-native's
 *   installDictationSource plays it).
 * - `location` queues too, so a list of locations plays a route one read at a time, but the last
 *   one taken stays: the phone is still there for the next read and for geofences.
 * - `permission` sets the standing answer for one permission, as the phone remembers a choice.
 * - `network: 'offline'` makes the app's every fetch fail as offline (createOfflineFetch) and
 *   takes the shell offline (networkStatus), which shows the NoConnection banner and fires the
 *   app's `offline` events, until `network: 'online'`.
 * - `clear` drops every injection and goes back online.
 * - `push` is refused: showing a payload as a local notification needs expo-notifications.
 *
 * @param {Object} params
 * @param {{ setInjectedOffline: (offline: boolean) => void }} params.networkStatus The shell's
 *   online state (host/networkStatus.js).
 */
function createDeviceInjections({ networkStatus }) {
  let queues = new Map();
  let standing = new Map();
  let offline = false;

  function setOffline(next) {
    offline = next;
    networkStatus.setInjectedOffline(next);
  }

  function queue(kind) {
    if (!queues.has(kind)) {
      queues.set(kind, []);
    }
    return queues.get(kind);
  }

  function inject({ kind, name, value }) {
    validateInjection({ kind, name, value });
    switch (kind) {
      case 'clear':
        queues = new Map();
        standing = new Map();
        setOffline(false);
        return { ok: true, kind };
      case 'network':
        setOffline(value === 'offline');
        return { ok: true, kind, network: value };
      case 'permission':
        standing.set(`permission:${name}`, value);
        return { ok: true, kind, name, answer: value };
      case 'location':
        queue(kind).push(...(type.isArray(value) ? value : [value]));
        return { ok: true, kind, pending: queue(kind).length };
      default:
        queue(kind).push(value);
        return { ok: true, kind, pending: queue(kind).length };
    }
  }

  function take(name) {
    if (name.startsWith('permission:')) {
      return standing.get(name);
    }
    if (name === 'location') {
      const next = queue(name).shift();
      if (next !== undefined) {
        standing.set(name, next);
      }
      return standing.get(name);
    }
    if (!NEXT_READ_KINDS.includes(name)) {
      throw new Error(
        `injected() reads ${[...NEXT_READ_KINDS, 'location', 'permission:<name>'].join(
          ', '
        )}. Received ${describe(name)}.`
      );
    }
    return queue(name).shift();
  }

  return { inject, isOffline: () => offline, take };
}

export default createDeviceInjections;
