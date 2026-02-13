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

import ConfigWarning from './ConfigWarning.js';

test('ConfigWarning creates warning with message only', () => {
  const warning = new ConfigWarning({ message: 'Test warning' });
  expect(warning.message).toBe('Test warning');
  expect(warning.source).toBeNull();
});

test('ConfigWarning stores source', () => {
  const warning = new ConfigWarning({
    message: 'Deprecated feature',
    source: 'config.yaml:10',
  });
  expect(warning.message).toBe('Deprecated feature');
  expect(warning.source).toBe('config.yaml:10');
});

test('ConfigWarning is not an Error instance', () => {
  const warning = new ConfigWarning({ message: 'Test' });
  expect(warning instanceof Error).toBe(false);
});
