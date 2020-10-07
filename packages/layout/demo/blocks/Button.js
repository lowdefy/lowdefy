import React from 'react';
import { Button } from 'antd';

const Blank = ({ blockId, properties }) => (
  <Button id={blockId} {...properties}>
    {blockId}
  </Button>
);

export default Blank;
