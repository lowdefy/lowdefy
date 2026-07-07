/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { serializer } from '@lowdefy/helpers';

import Block from './block/Block.js';
import Context from './Context.js';
import DisplayMessage from './DisplayMessage.js';
import Head from './Head.js';
import ProgressBarController from './ProgressBarController.js';

import initLowdefyContext from './initLowdefyContext.js';

const Client = ({
  apiBase,
  auth,
  Components,
  config: rawConfig,
  jsMap,
  lowdefy,
  resetContext = { reset: false, setReset: () => undefined },
  router,
  stage,
  types,
  window,
}) => {
  // Memoize on the fetched config objects, not the per-render wrapper — the
  // engine memoizes dynamic page contexts by config object identity, so the
  // deserialized config must be stable across re-renders and only change when
  // a new page fetch delivers new config.
  const config = React.useMemo(
    () => serializer.deserialize(rawConfig),
    [rawConfig.pageConfig, rawConfig.rootConfig]
  );
  // Dynamic pages rebuild their engine context per fetch — remount the page
  // tree with the rebuilt context instead of reconciling mounted blocks
  // against it, which React can silently drop. Static pages keep their
  // context and tree across navigations, so their key stays stable.
  const buildRef = React.useRef({ config: null, build: 0 });
  if (buildRef.current.config !== config) {
    buildRef.current = { config, build: buildRef.current.build + 1 };
  }
  const contextKey =
    config.pageConfig.dynamic === true
      ? `${config.pageConfig.id}:${buildRef.current.build}`
      : config.pageConfig.id;
  initLowdefyContext({
    apiBase,
    auth,
    Components,
    config,
    lowdefy,
    router,
    stage,
    types,
    window,
  });
  return (
    <>
      <ProgressBarController
        id="lowdefy-progress-bar"
        key={`${config.pageConfig.id}-progress-bar`}
        lowdefy={lowdefy}
        resetContext={resetContext}
      />
      <DisplayMessage
        id="lowdefy-display-message"
        key={`${config.pageConfig.id}-display-message`}
        Component={lowdefy._internal.blockComponents.Message}
        components={lowdefy._internal.components}
        methods={{
          registerMethod: (_, method) => {
            lowdefy._internal.displayMessage = method;
          },
        }}
      />
      <Context
        key={contextKey}
        config={config.pageConfig}
        jsMap={jsMap}
        lowdefy={lowdefy}
        resetContext={resetContext}
      >
        {(context) => {
          if (!context._internal.onInitDone) return '';
          return (
            <>
              <Head
                Component={Components.Head}
                properties={
                  context._internal.RootSlots.map[config.pageConfig.blockId].eval.properties
                }
              />
              <Block
                block={context._internal.RootSlots.map[config.pageConfig.blockId]}
                Blocks={context._internal.RootSlots}
                context={context}
                lowdefy={lowdefy}
                parentLoading={false}
              />
            </>
          );
        }}
      </Context>
    </>
  );
};

export default Client;
