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

import createDeviceInjections from './createDeviceInjections.js';
import createFakeNetwork from '../../test/createFakeNetwork.js';
import createNetworkStatus from '../../host/createNetworkStatus.js';

function createInjections() {
  const networkStatus = createNetworkStatus({ network: createFakeNetwork() });
  return createDeviceInjections({ networkStatus });
}

const fixtureImage = { base64: 'iVBORw0KGgo=', mimeType: 'image/png', width: 1, height: 1 };

test('scan, photo and nfc results are each taken once, in the order they were injected', () => {
  const injections = createInjections();
  expect(injections.inject({ kind: 'scan', value: { data: 'JOB-1', type: 'qr' } })).toEqual({
    ok: true,
    kind: 'scan',
    pending: 1,
  });
  injections.inject({ kind: 'scan', value: { data: 'JOB-2', type: 'code128' } });
  injections.inject({ kind: 'photo', value: fixtureImage });
  injections.inject({ kind: 'nfc', value: { id: '04:A2:19', records: [] } });
  expect(injections.take('scan')).toEqual({ data: 'JOB-1', type: 'qr' });
  expect(injections.take('photo')).toEqual(fixtureImage);
  expect(injections.take('scan')).toEqual({ data: 'JOB-2', type: 'code128' });
  expect(injections.take('scan')).toBeUndefined();
  expect(injections.take('photo')).toBeUndefined();
  expect(injections.take('nfc')).toEqual({ id: '04:A2:19', records: [] });
  expect(injections.take('nfc')).toBeUndefined();
});

test('transcripts queue, each dictation session taking the next one, and clear drops them', () => {
  const injections = createInjections();
  expect(
    injections.inject({
      kind: 'transcript',
      value: { partials: ['for', 'for Sam'], final: 'for Sam, can you look' },
    })
  ).toEqual({ ok: true, kind: 'transcript', pending: 1 });
  expect(injections.inject({ kind: 'transcript', value: { error: 'not-allowed' } })).toEqual({
    ok: true,
    kind: 'transcript',
    pending: 2,
  });
  injections.inject({ kind: 'permission', name: 'microphone', value: 'denied' });
  expect(injections.take('transcript')).toEqual({
    partials: ['for', 'for Sam'],
    final: 'for Sam, can you look',
  });
  expect(injections.take('permission:microphone')).toBe('denied');
  expect(injections.take('transcript')).toEqual({ error: 'not-allowed' });
  expect(injections.take('transcript')).toBeUndefined();
  injections.inject({ kind: 'transcript', value: { final: 'ship it' } });
  injections.inject({ kind: 'clear' });
  expect(injections.take('transcript')).toBeUndefined();
});

test('a location stays after it is read, and a route plays one location per read', () => {
  const injections = createInjections();
  expect(injections.take('location')).toBeUndefined();
  injections.inject({ kind: 'location', value: { latitude: -33.92, longitude: 18.42 } });
  expect(injections.take('location')).toEqual({ latitude: -33.92, longitude: 18.42 });
  expect(injections.take('location')).toEqual({ latitude: -33.92, longitude: 18.42 });
  expect(
    injections.inject({
      kind: 'location',
      value: [
        { latitude: -33.9, longitude: 18.4 },
        { latitude: -33.8, longitude: 18.5, accuracy: 5 },
      ],
    })
  ).toEqual({ ok: true, kind: 'location', pending: 2 });
  expect(injections.take('location')).toEqual({ latitude: -33.9, longitude: 18.4 });
  expect(injections.take('location')).toEqual({ latitude: -33.8, longitude: 18.5, accuracy: 5 });
  expect(injections.take('location')).toEqual({ latitude: -33.8, longitude: 18.5, accuracy: 5 });
});

test('a permission answer stands for that permission until it changes', () => {
  const injections = createInjections();
  expect(injections.take('permission:camera')).toBeUndefined();
  injections.inject({ kind: 'permission', name: 'camera', value: 'denied' });
  expect(injections.take('permission:camera')).toBe('denied');
  expect(injections.take('permission:camera')).toBe('denied');
  expect(injections.take('permission:location')).toBeUndefined();
  injections.inject({ kind: 'permission', name: 'camera', value: 'granted' });
  expect(injections.take('permission:camera')).toBe('granted');
});

test('network offline holds until the network is turned back on', () => {
  const injections = createInjections();
  expect(injections.isOffline()).toBe(false);
  expect(injections.inject({ kind: 'network', value: 'offline' })).toEqual({
    ok: true,
    kind: 'network',
    network: 'offline',
  });
  expect(injections.isOffline()).toBe(true);
  injections.inject({ kind: 'network', value: 'online' });
  expect(injections.isOffline()).toBe(false);
});

// The NoConnection banner and the app's online and offline events read the shell's online state.
test('network offline takes the shell offline, and online or clear brings it back', () => {
  const networkStatus = createNetworkStatus({ network: createFakeNetwork() });
  const injections = createDeviceInjections({ networkStatus });
  injections.inject({ kind: 'network', value: 'offline' });
  expect(networkStatus.isOnline()).toBe(false);
  injections.inject({ kind: 'network', value: 'online' });
  expect(networkStatus.isOnline()).toBe(true);
  injections.inject({ kind: 'network', value: 'offline' });
  injections.inject({ kind: 'clear' });
  expect(networkStatus.isOnline()).toBe(true);
});

test('clear drops every injection and goes back online', () => {
  const injections = createInjections();
  injections.inject({ kind: 'scan', value: { data: 'JOB-1' } });
  injections.inject({ kind: 'location', value: { latitude: 1, longitude: 2 } });
  injections.take('location');
  injections.inject({ kind: 'permission', name: 'location', value: 'denied' });
  injections.inject({ kind: 'network', value: 'offline' });
  expect(injections.inject({ kind: 'clear' })).toEqual({ ok: true, kind: 'clear' });
  expect(injections.take('scan')).toBeUndefined();
  expect(injections.take('location')).toBeUndefined();
  expect(injections.take('permission:location')).toBeUndefined();
  expect(injections.isOffline()).toBe(false);
});

test('a push injection is refused until the shell carries expo-notifications', () => {
  const injections = createInjections();
  expect(() => injections.inject({ kind: 'push', value: { title: 'New job' } })).toThrow(
    'Push injection needs expo-notifications to show a local notification, and Lowdefy Dev does not include it yet.'
  );
});

test.each([
  [
    { kind: 'beep' },
    'An injection kind is one of scan, photo, nfc, transcript, location, permission, network, push, clear. Received "beep".',
  ],
  [{ kind: 'scan', value: 'JOB-1' }, 'A scan injection needs { data }. Received "JOB-1".'],
  [{ kind: 'photo', value: {} }, 'A photo injection needs { base64 }. Received {}.'],
  [
    { kind: 'nfc', value: 'tag' },
    'An nfc injection needs the tag read as an object. Received "tag".',
  ],
  [
    { kind: 'transcript', value: 'for Sam' },
    'A transcript injection needs { final } with optional { partials } (a list of strings), or { error }. Received "for Sam".',
  ],
  [
    { kind: 'transcript', value: { partials: ['for'] } },
    'A transcript injection needs { final } with optional { partials } (a list of strings), or { error }. Received {"partials":["for"]}.',
  ],
  [
    { kind: 'transcript', value: { partials: 'for', final: 'for Sam' } },
    'A transcript injection needs { final } with optional { partials } (a list of strings), or { error }. Received {"partials":"for","final":"for Sam"}.',
  ],
  [
    { kind: 'transcript', value: { error: '' } },
    'A transcript injection needs { final } with optional { partials } (a list of strings), or { error }. Received {"error":""}.',
  ],
  [
    { kind: 'location', value: { latitude: '1', longitude: 2 } },
    'A location injection needs { latitude, longitude }, or a route as a list of them. Received {"latitude":"1","longitude":2}.',
  ],
  [
    { kind: 'location', value: [] },
    'A location injection needs { latitude, longitude }, or a route as a list of them. Received [].',
  ],
  [
    { kind: 'permission', value: 'granted' },
    "A permission injection needs the permission's name. Received undefined.",
  ],
  [
    { kind: 'permission', name: 'camera', value: 'yes' },
    'A permission answer is "granted" or "denied". Received "yes".',
  ],
  [
    { kind: 'network', value: false },
    'A network injection is "online" or "offline". Received false.',
  ],
])('an invalid injection is refused with what was wrong: %j', (injection, message) => {
  const injections = createInjections();
  expect(() => injections.inject(injection)).toThrow(message);
});

test('reading an injection by a name no device action uses throws', () => {
  const injections = createInjections();
  expect(() => injections.take('barcode')).toThrow(
    'injected() reads scan, photo, nfc, transcript, location, permission:<name>. Received "barcode".'
  );
});
