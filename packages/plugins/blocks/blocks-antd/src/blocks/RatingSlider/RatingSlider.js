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

import React, { useState } from 'react';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { get, mergeObjects, serializer, type } from '@lowdefy/helpers';
import { Slider } from 'antd';
import classNames from 'classnames';

import CheckboxSelector from '../CheckboxSelector/CheckboxSelector.js';
import Label from '../Label/Label.js';

const includeMarks = (minMax, minMin, step = 1) => {
  const marks = {};
  marks[minMin] = {
    style: {
      marginTop: 2,
      fontSize: 12,
    },
    label: <span />,
  };
  // round to fix floating point error
  for (let k = minMax[0]; k <= minMax[1]; k = parseFloat((k + step).toPrecision(8))) {
    marks[k] = {
      style: {
        marginTop: 2,
        fontSize: 12,
      },
      label: <strong>{k}</strong>,
    };
  }
  return marks;
};

const styles = {
  iconLeft: {
    flex: '0 0 1',
    fontSize: '20px',
    padding: '6px 6px 0 0',
  },
  iconRight: {
    flex: '0 0 1',
    fontSize: '20px',
    padding: '6px 0 0 6px',
  },
  checkbox: {
    flex: '0 0 1',
    paddingTop: 6,
  },
  slider: {
    flex: 'auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
  },
};

const RatingSlider = ({
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
  const [check, unCheck] = useState(false);
  let propertiesIconMin = serializer.copy(properties.minIcon);
  if (type.isString(propertiesIconMin)) {
    propertiesIconMin = { name: propertiesIconMin };
  }
  let propertiesIconMax = serializer.copy(properties.maxIcon);
  if (type.isString(propertiesIconMax)) {
    propertiesIconMax = { name: propertiesIconMax };
  }
  const minMax = [get(properties, 'max', { default: 10 }), properties.min ?? 0].sort(
    (a, b) => a - b
  );

  // round to fix floating point error
  const minMin = parseFloat((minMax[0] - (properties.step ?? 1)).toPrecision(8));
  const validationColor =
    validation.status === 'error' ? '#ff4d4f' : validation.status === 'warning' ? '#faad14' : null;
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
          <div
            className={methods.makeCssClass([
              styles.content,
              {
                paddingRight: validation.status && 30,
              },
            ])}
          >
            {!required && !properties.disableNotApplicable && (
              <CheckboxSelector
                blockId={`${blockId}_checkbox_selector`}
                components={{ Icon, Link }}
                properties={mergeObjects([
                  {
                    label: { disabled: true },
                    options: [{ value: true, label: properties.notApplicableLabel ?? 'N/A' }],
                    color: properties.color,
                    disabled: properties.disabled || loading,
                  },
                  properties.CheckboxInput,
                  { style: styles.checkbox },
                ])}
                methods={{
                  ...methods,
                  setValue: (val) => {
                    if (val[0] === true) {
                      unCheck(true);
                      methods.setValue(properties.notApplicableLabel ?? 'N/A');
                    } else {
                      unCheck(false);
                    }
                  },
                }}
                value={[check]}
              />
            )}
            {!properties.disableIcons && (
              <Icon
                blockId={`${blockId}_iconMin`}
                events={events}
                properties={mergeObjects([
                  {
                    name: 'AiOutlineFrown',
                    style: styles.iconLeft,
                    color: properties.color,
                  },
                  propertiesIconMin,
                ])}
              />
            )}
            <Slider
              id={`${blockId}_input`}
              components={{ Icon, Link }}
              events={events}
              className={classNames(
                methods.makeCssClass([
                  properties.color && {
                    '& > div.ant-slider-track': {
                      backgroundColor: `${properties.color} !important`,
                    },
                    '& > div.ant-slider-handle': { borderColor: `${properties.color} !important` },
                    '& > div.ant-slider-step > span.ant-slider-dot-active': {
                      borderColor: `${properties.color} !important`,
                    },
                  },
                  validationColor && {
                    '& > div.ant-slider-rail': { backgroundColor: `${validationColor} !important` },
                  },
                ]),
                methods.makeCssClass(styles.slider),
                methods.makeCssClass(properties.inputStyle)
              )}
              autoFocus={properties.autoFocus}
              disabled={
                properties.disabled ||
                (check === true && !properties.disableNotApplicable) ||
                loading
              }
              dots={get(properties, 'showDots', { default: true })}
              tooltipVisible={
                value === null || properties.tooltipVisible === 'never'
                  ? false
                  : properties.tooltipVisible === 'always'
                    ? true
                    : undefined
              }
              tipFormatter={(val) => `${val}`}
              marks={
                properties.marks ??
                (get(properties, 'showMarks', { default: true })
                  ? includeMarks(minMax, minMin, properties.step ?? 1)
                  : undefined)
              }
              min={minMin}
              max={minMax[1]}
              range={false}
              step={properties.step ?? 1}
              onChange={(val) => {
                if (val === minMin) {
                  methods.setValue(null);
                } else {
                  methods.setValue(val);
                }
                methods.triggerEvent({ name: 'onChange' });
              }}
              value={value === null ? minMin : value}
            />
            {!properties.disableIcons && (
              <Icon
                blockId={`${blockId}_iconMax`}
                events={events}
                properties={mergeObjects([
                  {
                    name: 'AiOutlineSmile',
                    style: styles.iconRight,
                    color: properties.color,
                  },
                  propertiesIconMax,
                ])}
              />
            )}
          </div>
        ),
      }}
    />
  );
};

RatingSlider.defaultProps = blockDefaultProps;
RatingSlider.meta = {
  valueType: 'any',
  category: 'input',
  icons: [...Label.meta.icons, 'AiOutlineFrown', 'AiOutlineSmile'],
  styles: ['blocks/RatingSlider/style.less'],
};

export default RatingSlider;
