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
// Single source of truth for the _js function prototypes. The build lint
// (lintJsBodies) and the generated jsMap modules (generateClientJsModule,
// writeJs) both read from here so they can never disagree about a prototype.
export const CLIENT_JS_PARAMS = [
  'actions',
  'args',
  'event',
  'input',
  'location',
  'lowdefyApp',
  'lowdefyGlobal',
  'request',
  'state',
  'urlQuery',
  'user',
];

export const SERVER_JS_PARAMS = [
  'args',
  'item',
  'lowdefyApp',
  'payload',
  'secret',
  'state',
  'step',
  'user',
];

// A body written for one prototype and used at the other position fails
// silently at runtime, so the lint names the environment whose prototype does
// provide a name the current environment's does not.
export function parameterEnvironment(name) {
  if (CLIENT_JS_PARAMS.includes(name)) return 'client';
  if (SERVER_JS_PARAMS.includes(name)) return 'server';
  return undefined;
}

function toPrototype(params) {
  return `{ ${params.join(', ')} }`;
}

export function clientJsPrototype() {
  return toPrototype(CLIENT_JS_PARAMS);
}

export function serverJsPrototype() {
  return toPrototype(SERVER_JS_PARAMS);
}
