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
import { QRCode } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const QRCodeBlock = ({ blockId, classNames = {}, methods, properties, styles = {} }) => (
  <QRCode
    id={blockId}
    className={classNames.element}
    classNames={{ cover: classNames.cover }}
    style={styles.element}
    styles={{ cover: styles.cover }}
    value={properties.value ?? ''}
    size={properties.size ?? undefined}
    color={properties.color}
    bgColor={properties.bgColor ?? undefined}
    errorLevel={properties.errorLevel ?? undefined}
    icon={properties.icon}
    iconSize={properties.iconSize}
    marginSize={properties.marginSize}
    minVersion={properties.minVersion}
    type={properties.type ?? undefined}
    bordered={properties.bordered ?? undefined}
    status={properties.status ?? undefined}
    onRefresh={() => methods.triggerEvent({ name: 'onRefresh' })}
  />
);

export default withTheme('QRCode', withBlockDefaults(QRCodeBlock));
