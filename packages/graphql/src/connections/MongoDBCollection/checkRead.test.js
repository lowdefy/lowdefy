/*
  Copyright 2020 Lowdefy, Inc

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

import { ConfigurationError } from '../../context/errors';
import checkRead from './checkRead';

const context = {
  ConfigurationError,
};

test('Read explicitly true', () => {
  expect(checkRead({ connection: { read: true }, context })).toBe(undefined);
});

test('Read not set', () => {
  expect(checkRead({ connection: {}, context })).toBe(undefined);
});

test('Read false', () => {
  expect(() => checkRead({ connection: { read: false }, context })).toThrow(ConfigurationError);
  expect(() => checkRead({ connection: { read: false }, context })).toThrow(
    'MongoDBCollection connection does not allow reads.'
  );
});
