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

import { callerHash } from '@lowdefy/helpers';

import isOtherCaller from './isOtherCaller.js';

const user = { id: 'user_1', organization_id: 'org_1' };

test('isOtherCaller is false when the server answered as the rendered caller', () => {
  // The fixed vector callerHash's own tests pin, so server and client agree.
  expect(isOtherCaller({ serverCaller: '82e92667feb5824d', user })).toBe(false);
});

test('isOtherCaller is false for an anonymous page whose caller stays anonymous', () => {
  expect(isOtherCaller({ serverCaller: '', user: null })).toBe(false);
});

test('isOtherCaller is true when the server answered as another person', () => {
  const serverCaller = callerHash({ user: { id: 'user_2', organization_id: 'org_1' } });
  expect(isOtherCaller({ serverCaller, user })).toBe(true);
});

test('isOtherCaller is true when the server answered in another organization', () => {
  const serverCaller = callerHash({ user: { id: 'user_1', organization_id: 'org_2' } });
  expect(isOtherCaller({ serverCaller, user })).toBe(true);
});

test('isOtherCaller is true when the server answered as nobody to a signed-in page', () => {
  expect(isOtherCaller({ serverCaller: '', user })).toBe(true);
});

test('isOtherCaller is false when the response names no caller', () => {
  expect(isOtherCaller({ serverCaller: null, user })).toBe(false);
});
