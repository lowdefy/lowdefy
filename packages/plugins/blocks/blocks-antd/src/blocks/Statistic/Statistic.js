/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

const StatisticBlock = ({ blockId, components: { Icon }, events, properties, methods }) => {
  const additionalProps = {};
  if (properties.decimalSeparator) {
    additionalProps.decimalSeparator = properties.decimalSeparator;
  }
  return (
    <Statistic
      className={methods.makeCssClass(properties.style)}
      groupSeparator={properties.groupSeparator}
      id={blockId}
      loading={properties.loading}
      precision={properties.precision}
      title={renderHtml({ html: properties.title, methods })}
      value={type.isNone(properties.value) ? '' : properties.value}
      valueStyle={methods.makeCssClass(properties.valueStyle, true)}
      prefix={
        properties.prefixIcon ? (
          <Icon
            blockId={`${blockId}_prefixIcon`}
            events={events}
            properties={properties.prefixIcon}
          />
        ) : (
          properties.prefix ?? ''
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
          properties.suffix ?? ''
        )
      }
      {...additionalProps}
    />
  );
};

StatisticBlock.defaultProps = blockDefaultProps;
StatisticBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Statistic/style.less'],
};

export default StatisticBlock;
