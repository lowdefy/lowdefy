import React from 'react';
import { Loading, makeCssClass } from '@lowdefy/block-tools';
import { get } from '@lowdefy/helpers';
import { BlockLayout } from '@lowdefy/layout';

const LoadingBlock = ({ block, highlightBorders }) => (
  <BlockLayout
    id={`bl-loading-${block.blockId}`}
    blockStyle={get(block, 'eval.style') || get(block, 'meta.loading.style', { default: {} })}
    highlightBorders={highlightBorders}
    layout={get(block, 'eval.layout') || get(block, 'meta.loading.layout', { default: {} })}
    makeCssClass={makeCssClass}
  >
    <Loading
      properties={get(block, 'meta.loading.properties')}
      type={get(block, 'meta.loading.type')}
    />
  </BlockLayout>
);

export default LoadingBlock;
