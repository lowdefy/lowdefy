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
import { Slider } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const SliderBlock = ({
  blockId,
  classNames = {},
  components: { Icon, Link },
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
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <Slider
            id={`${blockId}_input`}
            autoFocus={properties.autoFocus}
            className={classNames.element}
            classNames={{
              handle: classNames.handle,
              rail: classNames.rail,
              track: classNames.track,
            }}
            disabled={getDisabled({ loading, properties })}
            dots={properties.dots}
            included={properties.included}
            keyboard={properties.keyboard}
            marks={properties.marks}
            max={properties.max}
            min={properties.min}
            range={properties.range}
            reverse={properties.reverse}
            step={properties.step}
            style={styles.element}
            styles={{
              handle: styles.handle,
              rail: styles.rail,
              track: styles.track,
            }}
            tooltip={properties.tooltip}
            vertical={properties.vertical}
            onBlur={() => {
              methods.triggerEvent({ name: 'onBlur' });
            }}
            onChange={(val) => {
              methods.setValue(val);
              methods.triggerEvent({ name: 'onChange', event: { value: val } });
            }}
            onChangeComplete={(val) => {
              methods.triggerEvent({ name: 'onChangeComplete', event: { value: val } });
            }}
            onFocus={() => {
              methods.triggerEvent({ name: 'onFocus' });
            }}
            value={value}
          />
        ),
      }}
    />
  );
};

export default withTheme('Slider', withBlockDefaults(SliderBlock));
