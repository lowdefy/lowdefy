import React from 'react';

const Paragraph = ({ blockId, properties }) => <div id={blockId}>{properties.content}</div>;

export default Paragraph;
