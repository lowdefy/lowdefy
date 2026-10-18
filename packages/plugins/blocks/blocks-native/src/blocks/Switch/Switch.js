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
import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { type } from '@lowdefy/helpers';

import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

function getStateText({ properties, value }) {
  const text = value === true ? properties.checkedText : properties.uncheckedText;
  return type.isString(text) ? text : undefined;
}

function Switch({ blockId, loading, methods, properties, required, styles, validation, value }) {
  const { isDark, tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ blockId, properties });
  const disabled = loading === true || properties.disabled === true || properties.loading === true;
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <View accessibilityLabel={accessibilityLabel} style={[{ alignItems: 'flex-start' }, styles.element]}>
        <Host
          colorScheme={isDark ? 'dark' : 'light'}
          matchContents
          seedColor={properties.color ?? tokens.colorPrimary}
        >
          <ExpoSwitch
            disabled={disabled}
            label={getStateText({ properties, value })}
            onValueChange={(checked) => {
              methods.setValue(checked);
              methods.triggerEvent({ name: 'onChange', event: { value: checked } });
            }}
            testID={`${blockId}_input`}
            value={value === true}
          />
        </Host>
      </View>
    </Label>
  );
}

Switch.meta = meta;

export default Switch;
