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
import { Row } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

import gutterSetup from './gutterSetup.js';

const Area = ({ area = {}, areaStyle, children, highlightBorders, id, makeCssClass }) => (
  <Row
    id={id}
    align={area.align}
    className={makeCssClass(areaStyle)}
    gutter={gutterSetup(area.gutter)}
    justify={area.justify}
    style={{
      // antd keeps bottom margin which can cause overflow issues.
      flexDirection: area.direction,
      flexWrap: area.wrap,
      overflow: area.overflow,
      border: highlightBorders && '1px dashed red',
    }}
  >
    {children}
  </Row>
);

Area.defaultProps = blockDefaultProps;

export default Area;
