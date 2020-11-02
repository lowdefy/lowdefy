/*
  Copyright 2020 Lowdefy, Inc

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
import { get, type } from '@lowdefy/helpers';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';

const MonthPicker = DatePicker.MonthPicker;

const disabledDate = ({ min, max, dates, ranges }) => (currentDate) => {
  if (min && currentDate < min) return true;
  if (max && currentDate > max) return true;
  let match = dates.find((date) => date.format('YYYY MM DD') === currentDate.format('YYYY MM DD'));
  if (match) return true;
  ranges.forEach((range) => {
    if (currentDate >= range[0] && currentDate <= range[1]) {
      match = true;
    }
  });
  if (match) return true;
  return false;
};

const MonthSelector = ({ blockId, loading, methods, properties, required, validate, value }) => {
  return (
    <Label
      blockId={blockId}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validate={validate}
      required={required}
      loading={loading}
      methods={methods}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <MonthPicker
              id={`${blockId}_input`}
              autoFocus={properties.autoFocus}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              disabled={properties.disabled}
              allowClear={properties.allowClear !== false}
              placeholder={properties.placeholder || 'Select Month'}
              format={properties.format || 'YYYY-MM'}
              size={properties.size}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    methods={methods}
                    properties={properties.suffixIcon || 'CalendarOutlined'}
                  />
                )
              }
              disabledDate={disabledDate({
                min: get(properties, 'disabledDates.min')
                  ? moment(get(properties, 'disabledDates.min'))
                  : undefined,
                max: get(properties, 'disabledDates.max')
                  ? moment(get(properties, 'disabledDates.max')).add(1, 'months')
                  : undefined,
                dates: (get(properties, 'disabledDates.dates') || []).map((date) => moment(date)),
                ranges: (get(properties, 'disabledDates.ranges') || [])
                  .map((range) => {
                    if (type.isArray(range) && range.length === 2) {
                      return [moment(range[0]), moment(range[1])];
                    }
                    return null;
                  })
                  .filter((range) => range !== null),
              })}
              onChange={(newVal) => {
                methods.setValue(
                  !newVal
                    ? null
                    : moment
                        .utc(newVal.add(newVal.utcOffset(), 'minutes'))
                        .startOf('month')
                        .toDate()
                );
                methods.callAction({ action: 'onChange' });
              }}
              value={type.isDate(value) ? moment.utc(value).startOf('month') : null}
            />
          </div>
        ),
      }}
    />
  );
};

MonthSelector.defaultProps = blockDefaultProps;

export default MonthSelector;
