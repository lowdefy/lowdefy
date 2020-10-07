import React from 'react';
import { Col } from 'antd';
import deriveLayout from './deriveLayout.js';

const alignSelf = (align) => {
  if (align === 'bottom') {
    return 'flex-end';
  }
  if (align === 'top') {
    return 'flex-start';
  }
  if (align === 'middle') {
    return 'center';
  }
  return align;
};

const BlockLayout = ({ id, blockStyle, children, highlightBorders, layout, makeCss }) => {
  if (layout && layout.disabled) {
    return (
      <div id={id} className={makeCss(blockStyle)}>
        {children}
      </div>
    );
  }
  return (
    <Col
      {...deriveLayout(layout)}
      style={{
        alignSelf: alignSelf(layout.align),
        border: highlightBorders && '1px dashed #8eccf5',
      }}
      id={id}
      className={makeCss(blockStyle)}
    >
      {children}
    </Col>
  );
};

export default BlockLayout;
