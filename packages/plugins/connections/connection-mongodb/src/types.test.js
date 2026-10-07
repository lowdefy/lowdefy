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

import MongoDBCollection from './connections/MongoDBCollection/MongoDBCollection.js';
import requestMetas from './connections/MongoDBCollection/requestMetas.js';
import types from './types.js';

test('types requests lists every MongoDBCollection request resolver', () => {
  expect(types.requests).toEqual(Object.keys(MongoDBCollection.requests));
});

test('every MongoDBCollection request resolver carries its requestMetas entry as meta', () => {
  Object.entries(MongoDBCollection.requests).forEach(([requestType, resolver]) => {
    expect(resolver.meta).toBe(requestMetas[requestType]);
  });
});
