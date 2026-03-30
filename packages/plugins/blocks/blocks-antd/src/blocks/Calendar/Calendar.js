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
import { Badge, Calendar } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';
import disabledDate from '../../disabledDate.js';

dayjs.extend(utc);

function buildDateMap(dateCellData) {
  if (!type.isArray(dateCellData)) return {};
  const map = {};
  dateCellData.forEach((item) => {
    if (type.isNone(item?.date)) return;
    const key = dayjs(item.date).format('YYYY-MM-DD');
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

const CalendarBlock = ({
  blockId,
  classNames = {},
  events,
  methods,
  properties,
  styles = {},
  value,
}) => {
  const dateMap = buildDateMap(properties.dateCellData);
  const hasDateData = Object.keys(dateMap).length > 0;

  return (
    <Calendar
      id={blockId}
      className={classNames.element}
      style={styles.element}
      fullscreen={properties.fullscreen !== false}
      mode={properties.mode}
      disabledDate={disabledDate(properties.disabledDates ?? {})}
      validRange={
        type.isArray(properties.validRange) && properties.validRange.length === 2
          ? [dayjs(properties.validRange[0]), dayjs(properties.validRange[1])]
          : undefined
      }
      value={type.isDate(value) ? dayjs(value) : undefined}
      onSelect={(date, selectInfo) => {
        // Wrap with our dayjs — antd v6's internal dayjs may lack the utc plugin.
        const d = dayjs(date);
        const val = d.toDate();
        if (selectInfo?.source === 'date') {
          methods.setValue(val);
          methods.triggerEvent({
            name: 'onSelect',
            event: {
              value: val,
              date: d.format('YYYY-MM-DD'),
              source: selectInfo.source,
            },
          });
        }
      }}
      onChange={(date) => {
        const d = dayjs(date);
        const val = d.toDate();
        methods.setValue(val);
        methods.triggerEvent({
          name: 'onChange',
          event: {
            value: val,
            date: d.format('YYYY-MM-DD'),
          },
        });
      }}
      onPanelChange={(date, mode) => {
        const d = dayjs(date);
        methods.triggerEvent({
          name: 'onPanelChange',
          event: {
            value: d.toDate(),
            date: d.format('YYYY-MM-DD'),
            mode,
          },
        });
      }}
      cellRender={
        hasDateData
          ? (current, info) => {
              if (info.type !== 'date') return info.originNode;
              const key = dayjs(current).format('YYYY-MM-DD');
              const items = dateMap[key];
              if (!items) return null;
              return (
                <ul
                  className="ant-picker-calendar-events"
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                >
                  {items.map((item, i) => (
                    <li key={i}>
                      <Badge
                        status={item.status ?? 'default'}
                        color={item.color}
                        text={item.content}
                      />
                    </li>
                  ))}
                </ul>
              );
            }
          : undefined
      }
    />
  );
};

export default withTheme('Calendar', withBlockDefaults(CalendarBlock));
