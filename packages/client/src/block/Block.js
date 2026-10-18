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

import React, { useEffect, useRef, useState } from 'react';

import { ErrorBoundary } from '@lowdefy/block-utils';

import CategorySwitch from './CategorySwitch.js';
import MountEvents from '../MountEvents.js';

const Block = ({ block, Blocks, context, lowdefy, parentLoading, renderHead }) => {
  const [updates, setUpdate] = useState(0);
  const loggedErrorsRef = useRef(new Set());
  // The block's one updater for this component's life. It registers on render, as the engine
  // can update the block before the first commit, and again when mounted (a StrictMode remount
  // unregisters it); unmounting removes only this copy's. A native shell can show one page on
  // two screens, and each copy of the block keeps its own updater (engine createUpdaters).
  const updater = useRef(() => setUpdate((count) => count + 1)).current;
  context._internal.updaters.register(block.id, updater);
  useEffect(
    () => context._internal.updaters.register(block.id, updater),
    [block.id, context, updater]
  );

  const handleError = (error) => {
    if (lowdefy._internal.handleError) {
      lowdefy._internal.handleError(error);
    }
  };

  // Log parse errors to server
  useEffect(() => {
    if (block.eval?.parseErrors && lowdefy._internal.handleError) {
      block.eval.parseErrors.forEach((error) => {
        // Use error message as key to avoid duplicate logs
        const errorKey = `${block.id}:${error.message}`;
        if (!loggedErrorsRef.current.has(errorKey)) {
          loggedErrorsRef.current.add(errorKey);
          lowdefy._internal.handleError(error);
        }
      });
    }
  }, [block.eval?.parseErrors, block.id, lowdefy._internal]);

  return (
    <ErrorBoundary
      blockId={block.blockId}
      blockType={block.type}
      configKey={block.eval?.configKey}
      onError={handleError}
      properties={block.eval?.properties}
    >
      {renderHead?.({ properties: block.eval.properties })}
      <MountEvents
        context={context}
        triggerEvent={async () => {
          context._internal.lowdefy._internal.progress.dispatch({
            type: 'increment-on-mount',
            id: block.id,
          });
          await block.triggerEvent({
            name: 'onMount',
            progress: () => {
              lowdefy._internal.progress.dispatch({
                type: 'increment',
              });
            },
          });
        }}
        triggerEventAsync={() => {
          block.triggerEvent({
            name: 'onMountAsync',
            progress: () => {
              lowdefy._internal.progress.dispatch({
                type: 'increment',
              });
            },
          });
          lowdefy._internal.progress.dispatch({
            type: 'done',
          });
        }}
        waitForMount={Object.hasOwn(block.Events.events, 'onMount')}
      >
        {(eventLoading) => (
          <CategorySwitch
            block={block}
            Blocks={Blocks}
            context={context}
            loading={eventLoading || parentLoading || block.eval.loading}
            lowdefy={lowdefy}
            updates={updates}
          />
        )}
      </MountEvents>
    </ErrorBoundary>
  );
};

export default Block;
