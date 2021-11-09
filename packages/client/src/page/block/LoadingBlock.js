import React from 'react';
import { Loading, makeCssClass } from '@lowdefy/block-utils';
import { get } from '@lowdefy/helpers';
import { BlockLayout } from '@lowdefy/layout';

const LoadingBlock = ({ block, lowdefy }) => (
  <BlockLayout
    id={`bl-loading-${block.blockId}`}
    blockStyle={get(block, 'eval.style') || get(block, 'meta.loading.style', { default: {} })}
    highlightBorders={lowdefy.lowdefyGlobal.highlightBorders}
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
