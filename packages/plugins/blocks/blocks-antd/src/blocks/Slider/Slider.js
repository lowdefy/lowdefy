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

import React from 'react';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Slider } from 'antd';
import classNames from 'classnames';

import Label from '../Label/Label.js';

const SliderBlock = ({
  blockId,
  components: { Icon, Link },
  events,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <Slider
            id={`${blockId}_input`}
            className={classNames(methods.makeCssClass(properties.inputStyle))}
            disabled={properties.disabled || loading}
            dots={properties.dots}
            handleStyle={properties.handleStyle}
            included={properties.included}
            marks={properties.marks}
            max={properties.max}
            min={properties.min}
            railStyle={properties.railStyle}
            range={properties.range}
            reverse={properties.reverse}
            step={properties.step}
            tooltip={properties.tooltip}
            trackStyle={properties.trackStyle}
            vertical={properties.vertical}
            onChange={(val) => {
              methods.setValue(val);
              methods.triggerEvent({ name: 'onChange' });
            }}
            value={value}
          />
        ),
      }}
    />
  );
};

SliderBlock.defaultProps = blockDefaultProps;
SliderBlock.meta = {
  valueType: 'any',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/Slider/style.less'],
};

export default SliderBlock;
