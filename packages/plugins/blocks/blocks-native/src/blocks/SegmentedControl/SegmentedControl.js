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
import { SegmentedControl as NativeSegmentedControl } from '@expo/ui/community/segmented-control';

import getOptionIndex from '../Selector/getOptionIndex.js';
import getOptionLabel from '../Selector/getOptionLabel.js';
import getOptionValue from '../Selector/getOptionValue.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// No segment is selected while the value matches no option.
const NO_SEGMENT = -1;

/**
 * The platform segmented control (a SwiftUI segmented Picker on iOS, Material segmented buttons
 * on Android) as an input: one segment per option, the value is the picked option's value, as a
 * Selector's is. It fills the width of its container.
 */
function SegmentedControl({ blockId, loading, methods, properties, styles = {}, value }) {
  const { isDark, tokens } = useBlockTokens({ properties });
  const options = properties.options ?? [];
  const selectedIndex = getOptionIndex({ options, value }) ?? NO_SEGMENT;
  const disabled = loading === true || properties.disabled === true;
  return (
    <View
      accessibilityLabel={properties.title ?? undefined}
      style={[{ alignSelf: 'stretch' }, styles.element]}
    >
      <NativeSegmentedControl
        appearance={isDark ? 'dark' : 'light'}
        enabled={!disabled}
        onChange={({ nativeEvent }) => {
          const index = nativeEvent.selectedSegmentIndex;
          if (index === selectedIndex) {
            return;
          }
          const next = getOptionValue({ option: options[index] });
          methods.setValue(next);
          methods.triggerEvent({ name: 'onChange', event: { value: next } });
        }}
        selectedIndex={selectedIndex}
        testID={`${blockId}_input`}
        tintColor={tokens.colorPrimary}
        values={options.map((option) => getOptionLabel({ option }))}
      />
    </View>
  );
}

SegmentedControl.meta = meta;

export default SegmentedControl;
