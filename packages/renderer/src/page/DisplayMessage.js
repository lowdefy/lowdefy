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
import { version } from '../../package.json';

import { ErrorBoundary, makeCssClass } from '@lowdefy/block-tools';

import LoadBlock from './block/LoadBlock';

const Block = ({ methods }) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={''}>
        <LoadBlock
          meta={{
            moduleFederation: {
              module: 'Message',
              scope: '_at_lowdefy_slash_blocks_dash_antd',
              version,
              remoteEntryUrl: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/remoteEntry.js`,
            },
          }}
          Loading={''}
          render={(Comp) => (
            <Comp
              blockId="__display_message"
              key="__display_message"
              methods={{
                makeCssClass,
                registerMethod: methods.registerMethod,
                triggerEvent: () => undefined,
              }}
              properties={{}}
            />
          )}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Block;
