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

import createAssetLinks from './createAssetLinks.js';

test('createAssetLinks states every Android shell with its signing fingerprints', () => {
  const mobileConfig = {
    shells: [
      { id: 'field', android: { package: 'com.example.field', sha256: ['AA:BB', 'CC:DD'] } },
      { id: 'ios-only', ios: { bundleId: 'com.example.ios', teamId: 'TEAM' } },
    ],
  };
  expect(createAssetLinks({ mobileConfig })).toEqual([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.example.field',
        sha256_cert_fingerprints: ['AA:BB', 'CC:DD'],
      },
    },
  ]);
});

test('createAssetLinks leaves out an Android shell without a fingerprint', () => {
  const mobileConfig = {
    shells: [{ id: 'field', android: { package: 'com.example.field' } }],
  };
  expect(createAssetLinks({ mobileConfig })).toBeNull();
});

test('createAssetLinks returns null for an app without shells', () => {
  expect(createAssetLinks({ mobileConfig: {} })).toBeNull();
});
