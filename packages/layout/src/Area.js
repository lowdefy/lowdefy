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
import layoutParamsToArea from './layoutParamsToArea.js';

const Area = ({ area = {}, areaKey, areaStyle, areaClassName, children, id, layout }) => {
  const derivedArea = layoutParamsToArea({ area, areaKey, layout });
  return (
    <Row
      id={id}
      align={derivedArea.align}
      className={areaClassName}
      gutter={gutterSetup(derivedArea.gutter)}
      justify={derivedArea.justify}
      style={{
        flexDirection: derivedArea.direction,
        flexWrap: derivedArea.wrap,
        overflow: derivedArea.overflow,
        ...areaStyle,
      }}
    >
      {children}
    </Row>
  );
};

export default Area;
