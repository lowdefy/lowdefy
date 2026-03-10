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

import React, { useMemo } from 'react';
import { Tour } from 'antd';

import withTheme from '../withTheme.js';

const TourBlock = ({ blockId, classNames = {}, methods, properties, styles = {} }) => {
  const steps = useMemo(
    () =>
      (properties.steps ?? []).map((step) => ({
        ...step,
        target: step.target ? () => document.getElementById(step.target) : undefined,
        cover: step.cover ? <img src={step.cover} alt="" /> : undefined,
      })),
    [properties.steps]
  );

  return (
    <Tour
      id={blockId}
      className={classNames.element}
      style={styles.element}
      open={properties.open === true}
      steps={steps}
      current={properties.current}
      type={properties.type}
      placement={properties.placement}
      mask={properties.mask}
      arrow={properties.arrow}
      closable={properties.closable}
      keyboard={properties.keyboard}
      animated={properties.animated}
      zIndex={properties.zIndex}
      gap={properties.gap}
      scrollIntoViewOptions={properties.scrollIntoViewOptions}
      disabledInteraction={properties.disabledInteraction}
      onClose={(current) => {
        methods.triggerEvent({ name: 'onClose', event: { current } });
      }}
      onChange={(current) => {
        methods.triggerEvent({ name: 'onChange', event: { current } });
      }}
      onFinish={() => {
        methods.triggerEvent({ name: 'onFinish' });
      }}
    />
  );
};

TourBlock.meta = {
  category: 'display',
  icons: [],
  cssKeys: ['element'],
};

export default withTheme('Tour', TourBlock);
