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

// A stand-in for @expo/ui's community SegmentedControl that keeps its props, so a test picks a
// segment with fireEvent(view, 'change', { nativeEvent: { selectedSegmentIndex, value } }).
function SegmentedControl({
  appearance,
  enabled = true,
  onChange,
  selectedIndex,
  style,
  testID,
  tintColor,
  values,
}) {
  return (
    <View
      appearance={appearance}
      enabled={enabled}
      onChange={onChange}
      selectedIndex={selectedIndex}
      style={style}
      testID={testID}
      tintColor={tintColor}
      values={values}
    />
  );
}

export { SegmentedControl };
export default SegmentedControl;
