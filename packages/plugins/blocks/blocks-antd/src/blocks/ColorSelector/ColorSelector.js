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
import { ColorPicker } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import getColorValue from './getColorValue.js';
import toPickerColor from './toPickerColor.js';

const ColorSelectorInput = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      methods={methods}
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <ColorPicker
            id={`${blockId}_input`}
            className={classNames.element}
            classNames={{ popup: { root: classNames.popup } }}
            style={styles.element}
            styles={{ popup: { root: styles.popup } }}
            value={toPickerColor(value)}
            format={properties.format}
            showText={properties.showText}
            size={properties.size}
            disabled={getDisabled({ loading, properties })}
            allowClear={properties.allowClear}
            arrow={properties.arrow}
            disabledAlpha={properties.disabledAlpha}
            disabledFormat={properties.disabledFormat}
            mode={properties.mode}
            open={properties.open}
            placement={properties.placement}
            presets={properties.presets}
            trigger={properties.trigger}
            onChange={(color) => {
              const colorValue = getColorValue(color);
              methods.setValue(colorValue);
              methods.triggerEvent({ name: 'onChange', event: { value: colorValue } });
            }}
            onChangeComplete={(color) => {
              methods.triggerEvent({
                name: 'onChangeComplete',
                event: { value: getColorValue(color) },
              });
            }}
            onClear={() => {
              methods.triggerEvent({ name: 'onClear' });
            }}
            onFormatChange={(format) => {
              methods.triggerEvent({ name: 'onFormatChange', event: { format } });
            }}
            onOpenChange={(open) => {
              methods.triggerEvent({ name: 'onOpenChange', event: { open } });
            }}
          />
        ),
      }}
    />
  );
};

export default withTheme('ColorPicker', withBlockDefaults(ColorSelectorInput));
