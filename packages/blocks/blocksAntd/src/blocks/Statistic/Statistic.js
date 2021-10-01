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
import { Statistic } from 'antd';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

const StatisticBlock = ({ blockId, events, properties, methods }) => (
  <Statistic
    className={methods.makeCssClass(properties.style)}
    decimalSeparator={properties.decimalSeparator}
    groupSeparator={properties.groupSeparator}
    id={blockId}
    precision={properties.precision}
    title={renderHtml({ html: properties.title, methods })}
    value={type.isNone(properties.value) ? '' : properties.value}
    valueStyle={properties.valueStyle}
    prefix={
      properties.prefixIcon ? (
        <Icon
          blockId={`${blockId}_prefixIcon`}
          events={events}
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
          events={events}
          properties={properties.suffixIcon}
        />
      ) : (
        properties.suffix || ''
      )
    }
  />
);

StatisticBlock.defaultProps = blockDefaultProps;

export default StatisticBlock;
