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

import * as api from '@lowdefy/api';
import * as helpers from '@lowdefy/helpers';
import { expect, test } from 'vitest';

import toWirePayload from './toWirePayload.js';

const testApp = { modules: { api, helpers } };
const { serializer } = helpers;

test('toWirePayload carries a date as the marker the client sends, which the endpoint reads back as a date', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const wire = toWirePayload({ payload: { id: 'BR-1', from }, testApp });
  expect(wire).toEqual({ id: 'BR-1', from: { '~d': from.valueOf() } });
  expect(serializer.deserialize(wire)).toEqual({ id: 'BR-1', from });
});

test('toWirePayload drops what JSON cannot carry, as a request over HTTP does', () => {
  const wire = toWirePayload({
    payload: { id: 'BR-1', note: undefined, run: () => {}, lines: [1, undefined] },
    testApp,
  });
  expect(wire).toEqual({ id: 'BR-1', lines: [1, null] });
});

test('toWirePayload sends an empty object when no payload is given', () => {
  expect(toWirePayload({ payload: undefined, testApp })).toEqual({});
  expect(toWirePayload({ payload: null, testApp })).toEqual({});
});
