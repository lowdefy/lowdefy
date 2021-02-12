import React from 'react';
import { Loading } from '@lowdefy/block-tools';
import { get } from '@lowdefy/helpers';

import { BlockLayout } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-tools';

const LoadingBlock = ({ blockId, meta, highlightBorders }) => (
  <BlockLayout
    id={`bl-loading-${blockId}`}
    blockStyle={get(meta, 'loading.style', { default: {} })}
    highlightBorders={highlightBorders}
    layout={get(meta, 'loading.layout', { default: {} })}
    makeCssClass={makeCssClass}
  >
    <Loading properties={get(meta, 'loading.properties')} type={get(meta, 'loading.type')} />
  </BlockLayout>
);

export default LoadingBlock;
