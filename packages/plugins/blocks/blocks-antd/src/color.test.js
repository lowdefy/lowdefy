/*
  Copyright 2020-2024 Lowdefy, Inc

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

import color from './index.js';

test('antd blue test', () => {
  expect(color('#1890ff', 1)).toEqual('#e6f7ff');
  expect(color('#1890ff', 2)).toEqual('#bae7ff');
  expect(color('#1890ff', 3)).toEqual('#91d5ff');
  expect(color('#1890ff', 4)).toEqual('#69c0ff');
  expect(color('#1890ff', 5)).toEqual('#40a9ff');
  expect(color('#1890ff', 6)).toEqual('#178fff');
  expect(color('#1890ff', 7)).toEqual('#096dd9');
  expect(color('#1890ff', 8)).toEqual('#0050b3');
  expect(color('#1890ff', 9)).toEqual('#003a8c');
  expect(color('#1890ff', 10)).toEqual('#002766');
});
