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

import getSkeletonVariant from './getSkeletonVariant.js';

test('getSkeletonVariant takes the variant set', () => {
  expect(getSkeletonVariant({ variant: 'hero' })).toEqual('hero');
  expect(getSkeletonVariant({ count: 3, variant: 'insetGroup' })).toEqual('insetGroup');
});

test('getSkeletonVariant draws list rows for the row properties alone', () => {
  expect(getSkeletonVariant({ count: 4 })).toEqual('listRow');
  expect(getSkeletonVariant({ rows: 1 })).toEqual('listRow');
  expect(getSkeletonVariant({ avatar: false })).toEqual('listRow');
});

test('getSkeletonVariant draws one shape with no variant or row properties', () => {
  expect(getSkeletonVariant({})).toEqual('shape');
  expect(getSkeletonVariant({ height: 20, width: '50%' })).toEqual('shape');
});
