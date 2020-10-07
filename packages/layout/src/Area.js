import React from 'react';
import { Row } from 'antd';
import gutterSetup from './gutterSetup.js';

const Area = ({ area, areaStyle, children, highlightBorders, id, makeCss }) => (
  <Row
    id={id}
    align={area.align}
    className={makeCss(areaStyle)}
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

export default Area;
