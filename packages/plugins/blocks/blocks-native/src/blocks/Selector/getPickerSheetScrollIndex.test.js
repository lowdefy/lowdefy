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

import getPickerSheetScrollIndex from './getPickerSheetScrollIndex.js';

const windowHeight = 844;

test('getPickerSheetScrollIndex opens at the top while the chosen row shows at medium height', () => {
  expect(
    getPickerSheetScrollIndex({ searchShown: false, selectedPosition: -1, windowHeight })
  ).toBe(0);
  expect(getPickerSheetScrollIndex({ searchShown: false, selectedPosition: 5, windowHeight })).toBe(
    0
  );
});

test('getPickerSheetScrollIndex opens a long list near a chosen row below the medium height', () => {
  expect(
    getPickerSheetScrollIndex({ searchShown: false, selectedPosition: 20, windowHeight })
  ).toBe(18);
  // The search field takes a row's height.
  expect(getPickerSheetScrollIndex({ searchShown: true, selectedPosition: 5, windowHeight })).toBe(
    3
  );
});
