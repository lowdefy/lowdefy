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
import packageJson from '../../package.json';

import { ErrorBoundary, makeCssClass } from '@lowdefy/block-utils';

import LoadBlock from './block/LoadBlock';

const DisplayMessage = ({ methods }) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={''}>
        <LoadBlock
          meta={{
            moduleFederation: {
              module: 'Message',
              scope: '_at_lowdefy_slash_blocks_dash_antd',
              version: packageJson.version,
              remoteEntryUrl: `https://blocks-cdn.lowdefy.com/v${packageJson.version}/blocks-antd/remoteEntry.js`,
            },
          }}
        >
          {(Comp) =>
            Comp === false ? (
              ''
            ) : (
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
            )
          }
        </LoadBlock>
      </Suspense>
    </ErrorBoundary>
  );
};

export default DisplayMessage;
