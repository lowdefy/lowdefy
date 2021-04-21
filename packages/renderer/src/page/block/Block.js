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

import React, { Suspense, useState } from 'react';

import { ErrorBoundary } from '@lowdefy/block-tools';

import LoadBlock from './LoadBlock';
import LoadingBlock from './LoadingBlock';
import CategorySwitch from './CategorySwitch';

const Block = ({ block, Blocks, context, isRoot, lowdefy }) => {
  const [updates, setUpdate] = useState(0);
  lowdefy.updaters[block.id] = () => setUpdate(updates + 1);
  const Loading = (
    <LoadingBlock block={block} highlightBorders={lowdefy.lowdefyGlobal.highlightBorders} />
  );
  return (
    <ErrorBoundary>
      <Suspense fallback={Loading}>
        <LoadBlock
          meta={block.meta}
          Loading={Loading}
          render={(Comp) => (
            <CategorySwitch
              block={block}
              Blocks={Blocks}
              Component={Comp}
              context={context}
              isRoot={isRoot}
              lowdefy={lowdefy}
              updates={updates}
            />
          )}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Block;
