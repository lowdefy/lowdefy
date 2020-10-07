import React from 'react';

const Box = ({ blockId, content }) => (
  <div id={blockId}>{content.content && content.content()}</div>
);

export default Box;
