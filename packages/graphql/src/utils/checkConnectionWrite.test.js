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

import { ConfigurationError } from '../context/errors';
import checkConnectionWrite from './checkConnectionWrite';

const context = {
  ConfigurationError,
};

const connectionType = 'TestConnection';

test('Write explicitly true', () => {
  expect(checkConnectionWrite({ connection: { write: true }, context, connectionType })).toBe(
    undefined
  );
});

test('Write not set', () => {
  expect(() => checkConnectionWrite({ connection: {}, context, connectionType })).toThrow(
    ConfigurationError
  );
  expect(() => checkConnectionWrite({ connection: {}, context, connectionType })).toThrow(
    'TestConnection connection does not allow writes.'
  );
});

test('Write false', () => {
  expect(() =>
    checkConnectionWrite({ connection: { write: false }, context, connectionType })
  ).toThrow(ConfigurationError);
  expect(() =>
    checkConnectionWrite({ connection: { write: false }, context, connectionType })
  ).toThrow('TestConnection connection does not allow writes.');
});
