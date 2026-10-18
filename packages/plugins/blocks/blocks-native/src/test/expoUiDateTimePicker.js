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

import React from 'react';
import { View } from 'react-native';

// A stand-in for @expo/ui's community DateTimePicker that keeps its props, so a test fires
// fireEvent(view, 'valueChange', event, date) or fireEvent(view, 'dismiss').
function DateTimePicker({ maximumDate, minimumDate, mode, onDismiss, onValueChange, testID, value }) {
  return (
    <View
      maximumDate={maximumDate}
      minimumDate={minimumDate}
      mode={mode}
      onDismiss={onDismiss}
      onValueChange={onValueChange}
      testID={testID}
      value={value}
    />
  );
}

export { DateTimePicker };
export default DateTimePicker;
