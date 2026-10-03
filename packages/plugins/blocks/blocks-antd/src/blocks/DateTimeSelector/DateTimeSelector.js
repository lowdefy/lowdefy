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
import { getLocaleDateFormat, type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import disabledDate from '../../disabledDate.js';
import getPresets from '../../getPresets.js';

dayjs.extend(utc);

const DateTimeSelector = ({
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
  const timeUnit = !type.isString(properties.timeFormat)
    ? 'minute'
    : properties.timeFormat === 'HH:mm:ss'
      ? 'second'
      : properties.timeFormat === 'HH'
        ? 'hour'
        : 'minute';
  const onChange = (newVal) => {
    // Wrap with our dayjs — antd v6's internal dayjs may lack the utc plugin.
    const d = newVal ? dayjs(newVal) : null;
    const val = !d
      ? null
      : dayjs
          .utc(d.add(properties.selectUTC ? d.utcOffset() : 0, 'minutes'))
          .startOf(timeUnit)
          .toDate();
    methods.setValue(val);
    methods.triggerEvent({ name: 'onChange', event: { value: val } });
  };
  return (
    <Label
      blockId={blockId}
      methods={methods}
      classNames={classNames}
      components={{ Icon }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <DatePicker
              id={`${blockId}_input`}
              allowClear={
                properties.allowClear !== false && {
                  clearIcon: (
                    <Icon
                      blockId={`${blockId}_clearIcon`}
                      properties={{ name: 'clear', title: '' }}
                    />
                  ),
                }
              }
              autoFocus={properties.autoFocus}
              variant={
                properties.bordered === false ? 'borderless' : properties.variant ?? undefined
              }
              className={classNames.element}
              classNames={{ popup: { root: classNames.popup } }}
              style={{ width: '100%', ...styles.element }}
              styles={{ popup: { root: styles.popup } }}
              disabled={getDisabled({ loading, properties })}
              disabledDate={disabledDate(properties.disabledDates)}
              format={
                properties.format ??
                getLocaleDateFormat(methods.getLocale?.(), 'datetime') ??
                'YYYY-MM-DD HH:mm'
              }
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              inputReadOnly={properties.inputReadOnly}
              placeholder={properties.placeholder}
              placement={properties.placement}
              prefix={
                properties.prefix ||
                (properties.prefixIcon && (
                  <Icon
                    blockId={`${blockId}_prefixIcon`}
                    classNames={{ element: classNames.prefixIcon }}
                    events={events}
                    properties={properties.prefixIcon}
                    styles={{ element: styles.prefixIcon }}
                  />
                ))
              }
              presets={getPresets({
                disabledDates: properties.disabledDates,
                local: !properties.selectUTC,
                methods,
                presets: properties.presets,
              })}
              needConfirm={properties.needConfirm}
              showNow={properties.showNow ?? properties.showToday}
              showWeek={properties.showWeek}
              size={properties.size}
              status={validation.status}
              suffixIcon={
                <Icon
                  blockId={`${blockId}_suffixIcon`}
                  classNames={{ element: classNames.suffixIcon }}
                  events={events}
                  properties={properties.suffixIcon ?? { name: 'calendar', title: '' }}
                  styles={{ element: styles.suffixIcon }}
                />
              }
              showTime={{
                format: properties.timeFormat ?? 'HH:mm',
                hourStep: properties.hourStep ?? 1,
                minuteStep: properties.minuteStep ?? 5,
                secondStep: properties.secondStep ?? 30,
              }}
              onBlur={() => {
                methods.triggerEvent({ name: 'onBlur' });
              }}
              onClear={() => {
                methods.triggerEvent({ name: 'onClear' });
              }}
              onFocus={() => {
                methods.triggerEvent({ name: 'onFocus' });
              }}
              onOpenChange={(open) => {
                methods.triggerEvent({ name: 'onOpenChange', event: { open } });
              }}
              onChange={onChange}
              value={
                !type.isDate(value) ? null : properties.selectUTC ? dayjs.utc(value) : dayjs(value)
              }
            />
          </div>
        ),
      }}
    />
  );
};

export default withTheme('DatePicker', withBlockDefaults(DateTimeSelector));
