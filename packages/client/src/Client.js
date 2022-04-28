/*
  Copyright 2020-2022 Lowdefy, Inc

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

import React from 'react';

import Block from './block/Block.js';
import Context from './Context.js';
import Head from './Head.js';
import ProgressBarController from './ProgressBarController.js';

import initLowdefyContext from './initLowdefyContext.js';

const Client = ({ Components, config, router, stage, types, window }) => {
  const lowdefy = initLowdefyContext({ Components, config, router, types, stage, window });

  return (
    <ProgressBarController
      id="page-loader"
      key={config.pageConfig.id}
      ProgressBar={lowdefy._internal.blockComponents.ProgressBar}
      lowdefy={lowdefy}
      content={{
        content: (progress) => (
          <Context config={config.pageConfig} lowdefy={lowdefy} progress={progress}>
            {(context) => {
              return (
                <>
                  <Head
                    Component={Components.Head}
                    properties={
                      context._internal.RootBlocks.map[config.pageConfig.id].eval.properties
                    }
                  />
                  <Block
                    block={context._internal.RootBlocks.map[config.pageConfig.id]}
                    Blocks={context._internal.RootBlocks}
                    context={context}
                    lowdefy={lowdefy}
                    progress={progress}
                    parentLoading={false}
                  />
                </>
              );
            }}
          </Context>
        ),
      }}
    />
  );
};

export default Client;
