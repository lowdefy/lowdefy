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
import { Segmented } from 'antd';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const SegmentedInput = ({
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
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <Segmented
            id={`${blockId}_input`}
            className={classNames.element}
            style={styles.element}
            options={properties.options ?? []}
            size={properties.size}
            block={properties.block}
            disabled={properties.disabled || loading}
            value={type.isNone(value) ? undefined : value}
            onChange={(newVal) => {
              methods.setValue(newVal);
              methods.triggerEvent({ name: 'onChange', event: { value: newVal } });
            }}
          />
        ),
      }}
    />
  );
};

SegmentedInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  cssKeys: ['element'],
};

export default withTheme('Segmented', SegmentedInput);
