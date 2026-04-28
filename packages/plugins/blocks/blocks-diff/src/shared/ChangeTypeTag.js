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
import { Tag } from 'antd';
import {
  EditOutlined,
  MinusCircleOutlined,
  PauseCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';

import { CHANGE_TYPE_TAG_COLORS, CHANGE_TYPES, DEFAULT_CHANGE_TYPE_LABELS } from './constants.js';

const ICONS = {
  [CHANGE_TYPES.CREATE]: <PlusCircleOutlined />,
  [CHANGE_TYPES.REMOVE]: <MinusCircleOutlined />,
  [CHANGE_TYPES.CHANGE]: <EditOutlined />,
  [CHANGE_TYPES.UNCHANGED]: <PauseCircleOutlined />,
};

const LABEL_KEYS = {
  [CHANGE_TYPES.CREATE]: 'added',
  [CHANGE_TYPES.REMOVE]: 'removed',
  [CHANGE_TYPES.CHANGE]: 'changed',
  [CHANGE_TYPES.UNCHANGED]: 'unchanged',
};

function ChangeTypeTag({ type, labels, className }) {
  const color = CHANGE_TYPE_TAG_COLORS[type] ?? 'default';
  const labelKey = LABEL_KEYS[type] ?? 'changed';
  const labelText = (labels && labels[labelKey]) ?? DEFAULT_CHANGE_TYPE_LABELS[labelKey];
  return (
    <Tag color={color} icon={ICONS[type]} className={className} style={{ marginInlineEnd: 0 }}>
      {labelText}
    </Tag>
  );
}

export default ChangeTypeTag;
