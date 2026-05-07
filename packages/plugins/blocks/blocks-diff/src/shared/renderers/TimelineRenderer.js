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
import { Space, Timeline, Typography } from 'antd';
import {
  EditOutlined,
  MinusCircleOutlined,
  PauseCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';

import ValueCell from '../ValueCell.js';
import { CHANGE_TYPES } from '../constants.js';

const { Text } = Typography;

const COLOR_MAP = {
  [CHANGE_TYPES.CREATE]: 'green',
  [CHANGE_TYPES.REMOVE]: 'red',
  [CHANGE_TYPES.CHANGE]: 'blue',
  [CHANGE_TYPES.UNCHANGED]: 'gray',
};

const ICON_MAP = {
  [CHANGE_TYPES.CREATE]: <PlusCircleOutlined />,
  [CHANGE_TYPES.REMOVE]: <MinusCircleOutlined />,
  [CHANGE_TYPES.CHANGE]: <EditOutlined />,
  [CHANGE_TYPES.UNCHANGED]: <PauseCircleOutlined />,
};

function TimelineRenderer({
  model,
  collapseNested = true,
  showUnchanged = false,
  classNames = {},
  styles = {},
}) {
  const flattened = model.groups.flatMap((group) => group.changes);
  const filtered = flattened.filter(
    (change) => showUnchanged === true || change.type !== CHANGE_TYPES.UNCHANGED
  );

  if (filtered.length === 0) return null;

  const items = filtered.map((change, index) => ({
    key: change.pathStr || `change-${index}`,
    color: COLOR_MAP[change.type],
    dot: ICON_MAP[change.type],
    children: (
      <Space direction="vertical" size={2}>
        <Text strong>{change.breadcrumb}</Text>
        <ValueCell change={change} collapseNested={collapseNested} />
      </Space>
    ),
  }));

  return <Timeline items={items} className={classNames?.group} style={styles?.group} />;
}

export default TimelineRenderer;
