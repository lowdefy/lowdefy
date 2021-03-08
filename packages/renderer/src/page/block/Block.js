/*
  Copyright 2020-2021 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@lowdefy/block-tools';

import LoadBlock from './LoadBlock';
import LoadingBlock from './LoadingBlock';
import CategorySwitch from './CategorySwitch';
import WatchCache from './WatchCache';

const Block = ({ block, Blocks, context, lowdefy }) => {
  const Loading = (
    <LoadingBlock
      blockId={block.blockId}
      meta={block.meta}
      highlightBorders={lowdefy.lowdefyGlobal.highlightBorders}
    />
  );
  return (
    <ErrorBoundary>
      <Suspense fallback={Loading}>
        <LoadBlock
          meta={block.meta}
          Loading={Loading}
          render={(Comp) => (
            <WatchCache
              block={block}
              lowdefy={lowdefy}
              Loading={Loading}
              render={() => (
                <CategorySwitch
                  Component={Comp}
                  block={block}
                  Blocks={Blocks}
                  context={context}
                  lowdefy={lowdefy}
                />
              )}
            />
          )}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Block;
