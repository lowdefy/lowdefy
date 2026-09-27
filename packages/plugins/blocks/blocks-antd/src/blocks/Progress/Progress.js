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
import { Progress } from 'antd';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

// antd 6 renamed gapPosition to gapPlacement, with left/right as start/end.
const gapPlacements = { left: 'start', right: 'end', top: 'top', bottom: 'bottom' };

// antd 6 deprecated strokeWidth on line progress and width on circle progress in favour of size.
function getProgressSize({ properties }) {
  const progressType = properties.type ?? 'line';
  if (progressType === 'line') {
    const isPureLine = type.isNone(properties.steps);
    const sizeIsPreset = type.isNone(properties.size) || type.isString(properties.size);
    if (isPureLine && sizeIsPreset && !type.isNone(properties.strokeWidth)) {
      return [-1, properties.strokeWidth];
    }
    return properties.size;
  }
  return properties.size ?? properties.width;
}

const ProgressBlock = ({ blockId, classNames = {}, properties, styles = {} }) => {
  const additionalProps = {};
  // antd warns when strokeWidth is a key on line progress, even undefined, so it is only set for
  // steps and circles. Line progress gets it through size.
  const progressType = properties.type ?? 'line';
  if (progressType !== 'line' || !type.isNone(properties.steps)) {
    additionalProps.strokeWidth = properties.strokeWidth;
  }
  return (
    <Progress
      className={classNames.element}
      classNames={{
        indicator: classNames.indicator,
        rail: classNames.rail,
        track: classNames.track,
      }}
      gapDegree={properties.gapDegree}
      gapPlacement={gapPlacements[properties.gapPosition]}
      id={blockId}
      percent={properties.percent}
      percentPosition={properties.percentPosition}
      railColor={properties.trailColor}
      showInfo={properties.showInfo}
      size={getProgressSize({ properties })}
      status={properties.status}
      steps={properties.steps}
      strokeColor={properties.strokeColor}
      strokeLinecap={properties.strokeLinecap}
      style={styles.element}
      styles={{
        indicator: styles.indicator,
        rail: styles.rail,
        track: styles.track,
      }}
      success={properties.success}
      type={properties.type}
      {...additionalProps}
    />
  );
};

export default withTheme('Progress', withBlockDefaults(ProgressBlock));
