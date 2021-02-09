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

const RangePicker = DatePicker.RangePicker;

const rangeValue = (value, format) => {
  if (value && format) return value.map((val) => moment.utc(val, format).startOf('day'));
  if (value) return value.map((val) => moment.utc(val).startOf('day'));
  return null;
};

const DateRangeSelector = ({
  blockId,
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
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      loading={loading}
      methods={methods}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <RangePicker
              id={`${blockId}_input`}
              autoFocus={properties.autoFocus}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              disabled={properties.disabled}
              allowClear={properties.allowClear !== false}
              placeholder={
                (type.isArray(properties.placeholder) && [
                  properties.placeholder[0] || 'Start Date',
                  properties.placeholder[1] || 'End Date',
                ]) || ['Start Date', 'End Date']
              }
              format={properties.format || 'YYYY-MM-DD'}
              size={properties.size}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    blockId={`${blockId}_suffixIcon`}
                    events={events}
                    properties={properties.suffixIcon || 'CalendarOutlined'}
                    methods={methods}
                  />
                )
              }
              separator={properties.separator || '~'}
              disabledDate={disabledDate(properties.disabledDates)}
              onChange={(newVal) => {
                methods.setValue(
                  !newVal
                    ? null
                    : newVal.map((val) =>
                        moment.utc(val.add(val.utcOffset(), 'minutes')).startOf('day').toDate()
                      )
                );
                methods.triggerEvent({ name: 'onChange' });
              }}
              value={rangeValue(value)}
            />
          </div>
        ),
      }}
    />
  );
};

DateRangeSelector.defaultProps = blockDefaultProps;

export default DateRangeSelector;
