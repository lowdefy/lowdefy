/*
  Copyright 2020 Lowdefy, Inc

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

import { ErrorBoundary, Loading } from '@lowdefy/block-tools';
import get from '@lowdefy/get';

import LoadBlock from './LoadBlock';
import Defaults from './Defaults';
import CategorySwitch from './CategorySwitch';
import WatchCache from './WatchCache';

const Block = ({ block, Blocks, context, pageId, rootContext }) => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Loading
            properties={get(block, 'meta.loading.properties')}
            type={get(block, 'meta.loading.type')}
          />
        }
      >
        <LoadBlock
          meta={block.meta}
          render={(Comp) => (
            <Defaults
              Component={Comp}
              render={(CompWithDefaults) => (
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
              )}
            />
          )}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Block;
