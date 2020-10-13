import React, { Suspense } from 'react';

import { ErrorBoundary, Loading } from '@lowdefy/block-tools';

import LoadBlock from './LoadBlock';
import Defaults from './Defaults';
import CategorySwitch from './CategorySwitch';
import WatchCache from './WatchCache';

const Block = ({ block, Blocks, context, pageId, rootContext }) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <LoadBlock
          meta={block.meta}
          render={(Comp) => (
            <Defaults
              Component={Comp}
              render={(CompWithDefaults) => {
                console.log('block', context);
                return (
                  <WatchCache
                    block={block}
                    rootContext={rootContext}
                    render={() => (
                      <CategorySwitch
                        Component={CompWithDefaults}
                        block={block}
                        Blocks={Blocks}
                        context={context}
                        pageId={pageId}
                        rootContext={rootContext}
                      />
                    )}
                  />
                );
              }}
            />
          )}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Block;
