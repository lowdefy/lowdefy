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
  const statisticProps = {
    className: classNames.element,
    classNames: {
      content: classNames.content,
      prefix: classNames.prefix,
      suffix: classNames.suffix,
      title: classNames.title,
      value: classNames.value,
    },
    groupSeparator: properties.groupSeparator ?? undefined,
    id: blockId,
    loading: properties.loading,
    precision: properties.precision,
    title: renderHtml({ html: properties.title, methods }),
    style: styles.element,
    styles: {
      content: styles.content,
      prefix: styles.prefix,
      suffix: styles.suffix,
      title: styles.title,
      value: styles.value,
    },
    prefix: properties.prefixIcon ? (
      <Icon
        blockId={`${blockId}_prefixIcon`}
        classNames={{ element: classNames.prefixIcon }}
        events={events}
        properties={properties.prefixIcon}
        styles={{ element: styles.prefixIcon }}
      />
    ) : (
      properties.prefix ?? ''
    ),
    suffix: properties.suffixIcon ? (
      <Icon
        blockId={`${blockId}_suffixIcon`}
        classNames={{ element: classNames.suffixIcon }}
        events={events}
        properties={properties.suffixIcon}
        styles={{ element: styles.suffixIcon }}
      />
    ) : (
      properties.suffix ?? ''
    ),
    ...additionalProps,
  };
  // A timer's target often comes from a request that hasn't loaded yet; until it has, the block
  // renders the empty statistic the non-timer path shows, not a NaN countdown.
  if (type.isObject(properties.timer) && !type.isNone(properties.value)) {
    return (
      <Statistic.Timer
        {...statisticProps}
        format={properties.timer.format}
        onFinish={() => methods.triggerEvent({ name: 'onFinish' })}
        type={properties.timer.type}
        // A timestamp keeps the timer effect stable across re-renders that re-create a Date value.
        value={new Date(properties.value).getTime()}
      />
    );
  }
  return (
    <Statistic {...statisticProps} value={type.isNone(properties.value) ? '' : properties.value} />
  );
};

export default withTheme('Statistic', withBlockDefaults(StatisticBlock));
