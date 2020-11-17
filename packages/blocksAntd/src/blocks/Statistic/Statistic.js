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
import { Statistic } from 'antd';
import getFormatter from '@lowdefy/format';
import { get, type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

const StatisticBlock = ({ blockId, properties, methods }) => (
  <Statistic
    className={methods.makeCssClass(properties.style)}
    decimalSeparator={properties.decimalSeparator}
    groupSeparator={properties.groupSeparator}
    id={blockId}
    precision={properties.precision}
    title={properties.title}
    value={type.isNone(properties.value) ? '' : properties.value}
    valueStyle={properties.valueStyle}
    prefix={
      properties.prefixIcon ? (
        <Icon
          blockId={`${blockId}_prefixIcon`}
          methods={methods}
          properties={properties.prefixIcon}
        />
      ) : (
        properties.prefix || ''
      )
    }
    suffix={
      properties.suffixIcon ? (
        <Icon
          blockId={`${blockId}_suffixIcon`}
          methods={methods}
          properties={properties.suffixIcon}
        />
      ) : (
        properties.suffix || ''
      )
    }
    formatter={
      get(properties, 'formatter.type')
        ? getFormatter(get(properties, 'formatter.type'), get(properties, 'formatter.properties'))
        : undefined
    }
  />
);

StatisticBlock.defaultProps = blockDefaultProps;

export default StatisticBlock;
