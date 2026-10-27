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

import { LowdefyInternalError } from '@lowdefy/errors';

import checkTypeSet from './types/checkTypeSet.js';
import compareVersions from './version/compareVersions.js';
import getAppApiBase from './config/getAppApiBase.js';
import getCacheKey from './cache/getCacheKey.js';
import getOrigin from './host/getOrigin.js';
import isOnline from './host/isOnline.js';
import isShellTooOld from './version/isShellTooOld.js';
import { typeManifest, typeSets } from './test/fixtures.js';

test('compareVersions orders versions by major, minor and patch', () => {
  expect(compareVersions('7.4.0', '7.4.0')).toBe(0);
  expect(compareVersions('7.4.0', '7.10.0')).toBeLessThan(0);
  expect(compareVersions('8.0.0', '7.99.99')).toBeGreaterThan(0);
  expect(compareVersions('7.4.1-experimental-1', '7.4.1')).toBe(0);
});

test('isShellTooOld is false when the app sets no minShellVersion', () => {
  expect(isShellTooOld({ minShellVersion: null, shellVersion: '7.0.0' })).toBe(false);
  expect(isShellTooOld({ minShellVersion: '7.1.0', shellVersion: '7.0.0' })).toBe(true);
});

test('getCacheKey keys by app, caller and roles', () => {
  expect(getCacheKey({ appId: 'field', stamp: { caller: 'c1', roles: 'r1' } })).toBe('field:c1:r1');
  expect(getCacheKey({ appId: 'field', stamp: { caller: '', roles: null } })).toBe('field::');
  expect(getCacheKey({ appId: 'field', stamp: null })).toBe('field::');
});

test('checkTypeSet passes a type set the manifest carries', () => {
  expect(checkTypeSet({ manifest: typeManifest, typeSet: typeSets.carried })).toEqual([]);
});

test('checkTypeSet names a type the manifest has from another package', () => {
  expect(
    checkTypeSet({
      manifest: typeManifest,
      typeSet: { blocks: [{ type: 'Box', package: '@acme/blocks', version: 7 }] },
    })
  ).toEqual([{ category: 'blocks', type: 'Box', package: '@acme/blocks', version: 7 }]);
});

test('getAppApiBase reads the url for the shell environment', () => {
  const app = { id: 'field', urls: { production: 'https://field.example.com/' } };
  expect(getAppApiBase({ app, environment: 'production' })).toBe('https://field.example.com');
  expect(() => getAppApiBase({ app, environment: 'staging' })).toThrow(
    'Shell app "field" has no url for environment "staging". Received {"production":"https://field.example.com/"}.'
  );
  expect(() => getAppApiBase({ app, environment: 'staging' })).toThrow(LowdefyInternalError);
});

test('getOrigin reads the origin of the app url', () => {
  expect(getOrigin('http://192.168.1.4:3000/app')).toBe('http://192.168.1.4:3000');
  expect(() => getOrigin('field.example.com')).toThrow('Shell app url is not an absolute URL.');
  expect(() => getOrigin('field.example.com')).toThrow(LowdefyInternalError);
});

test('isOnline treats unknown reachability as online', () => {
  expect(isOnline({ isConnected: true, isInternetReachable: undefined })).toBe(true);
  expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  expect(isOnline({ isConnected: false })).toBe(false);
});
