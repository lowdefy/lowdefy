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
import { Statistic } from 'antd';
import { type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

import withTheme from '../withTheme.js';

const StatisticBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  properties,
  methods,
  styles = {},
}) => {
  const additionalProps = {};
  if (properties.decimalSeparator) {
    additionalProps.decimalSeparator = properties.decimalSeparator;
  }
  return (
    <Statistic
      className={classNames.element}
      classNames={{ value: classNames.value }}
      groupSeparator={properties.groupSeparator}
      id={blockId}
      loading={properties.loading}
      precision={properties.precision}
      title={renderHtml({ html: properties.title, methods })}
      value={type.isNone(properties.value) ? '' : properties.value}
      style={styles.element}
      styles={{ value: styles.value }}
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

export default withTheme('Statistic', withBlockDefaults(StatisticBlock));
