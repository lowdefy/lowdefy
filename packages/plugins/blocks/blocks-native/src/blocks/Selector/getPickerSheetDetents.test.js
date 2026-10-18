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

import getPickerSheetDetents from './getPickerSheetDetents.js';

const windowHeight = 844;

test('getPickerSheetDetents keeps a short list at the medium detent alone', () => {
  expect(
    getPickerSheetDetents({ platform: 'ios', rowCount: 4, searchShown: false, windowHeight })
  ).toEqual({ snapPoints: ['50%'], resizable: false });
});

test('getPickerSheetDetents gives a list longer than the medium height the large detent too', () => {
  expect(
    getPickerSheetDetents({ platform: 'ios', rowCount: 7, searchShown: false, windowHeight })
  ).toEqual({ snapPoints: undefined, resizable: true });
  expect(
    getPickerSheetDetents({ platform: 'android', rowCount: 7, searchShown: false, windowHeight })
  ).toEqual({ snapPoints: ['50%', '100%'], resizable: true });
});

test('getPickerSheetDetents gives a list with a search field the large detent', () => {
  expect(
    getPickerSheetDetents({ platform: 'ios', rowCount: 2, searchShown: true, windowHeight })
  ).toEqual({ snapPoints: undefined, resizable: true });
});
