/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { DatePicker } from 'antd';
import moment from 'moment';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import disabledDate from '../../disabledDate';

const WeekPicker = DatePicker.WeekPicker;

const WeekSelector = ({ blockId, loading, methods, properties, required, validation, value }) => {
  return (
    <Label
      blockId={blockId}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      loading={loading}
      methods={methods}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <WeekPicker
              id={`${blockId}_input`}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              autoFocus={properties.autoFocus}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              disabled={properties.disabled}
              allowClear={properties.allowClear !== false}
              placeholder={properties.placeholder || 'Select Week'}
              format={properties.format || 'YYYY-wo'}
              size={properties.size}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    blockId={`${blockId}_suffixIcon`}
                    methods={methods}
                    properties={properties.suffixIcon || 'CalendarOutlined'}
                  />
                )
              }
              disabledDate={disabledDate(properties.disabledDate)}
              onChange={(newVal) => {
                methods.setValue(
                  !newVal
                    ? null
                    : moment.utc(newVal.add(newVal.utcOffset(), 'minutes')).startOf('week').toDate()
                );
                methods.callAction({ action: 'onChange' });
              }}
              value={value && type.isDate(value) ? moment.utc(value).startOf('week') : null}
            />
          </div>
        ),
      }}
    />
  );
};

WeekSelector.defaultProps = blockDefaultProps;

export default WeekSelector;
