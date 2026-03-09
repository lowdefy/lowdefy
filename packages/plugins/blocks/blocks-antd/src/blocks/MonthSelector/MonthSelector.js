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

import React, { useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import disabledDate from '../../disabledDate.js';

dayjs.extend(utc);

const MonthSelector = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={{ Icon }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <DatePicker
              id={`${blockId}_input`}
              picker="month"
              allowClear={properties.allowClear !== false}
              autoFocus={properties.autoFocus}
              variant={properties.bordered === false ? 'borderless' : properties.variant}
              className={classNames.element}
              style={{ width: '100%', ...styles.element }}
              disabled={properties.disabled || loading}
              disabledDate={disabledDate(properties.disabledDates)}
              format={properties.format ?? 'YYYY-MM'}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              placeholder={properties.placeholder ?? 'Select Month'}
              size={properties.size}
              status={validation.status}
              value={type.isDate(value) ? dayjs.utc(value).startOf('month') : null}
              suffixIcon={
                <Icon
                  blockId={`${blockId}_suffixIcon`}
                  events={events}
                  properties={properties.suffixIcon ?? 'AiOutlineCalendar'}
                />
              }
              onChange={(newVal) => {
                const val = !newVal
                  ? null
                  : dayjs.utc(newVal.add(newVal.utcOffset(), 'minutes')).startOf('month').toDate();
                methods.setValue(val);
                methods.triggerEvent({ name: 'onChange', event: { value: val } });
              }}
            />
          </div>
        ),
      }}
    />
  );
};

MonthSelector.meta = {
  valueType: 'date',
  category: 'input',
  icons: [...Label.meta.icons, 'AiOutlineCalendar'],
  cssKeys: ['element', 'popup'],
};

export default withTheme('DatePicker', MonthSelector);
