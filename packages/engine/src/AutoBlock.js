import React from 'react';

import Block from './Block';

const AutoBlock = ({ page }) => {
  return (
    <>
      {page.blocks.map((block) => {
        return <Block key={block.id} meta={block.meta} />;
      })}
    </>
  );
};

export default AutoBlock;
