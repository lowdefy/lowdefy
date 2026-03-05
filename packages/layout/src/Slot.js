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
import { Row } from 'antd';

import gutterSetup from './gutterSetup.js';
import layoutParamsToSlot from './layoutParamsToSlot.js';

const Slot = ({ slot = {}, slotKey, slotStyle, slotClassName, children, id, layout }) => {
  const derivedSlot = layoutParamsToSlot({ slot, slotKey, layout });
  return (
    <Row
      id={id}
      align={derivedSlot.align}
      className={slotClassName}
      gutter={gutterSetup(derivedSlot.gutter)}
      justify={derivedSlot.justify}
      style={{
        flexDirection: derivedSlot.direction,
        flexWrap: derivedSlot.wrap,
        overflow: derivedSlot.overflow,
        ...slotStyle,
      }}
    >
      {children}
    </Row>
  );
};

export default Slot;
