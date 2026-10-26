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

// How long a render's registration waits for a commit before it is dropped.
const RENDER_REGISTRATION_MS = 1000;

const Block = ({ block, Blocks, context, lowdefy, parentLoading, renderHead }) => {
  const [updates, setUpdate] = useState(0);
  const loggedErrorsRef = useRef(new Set());
  // The block's one updater for this component's life. The engine can update a block before its
  // first commit, so it registers on render too; the effect then registers the committed copy
  // and takes over the render one. A render React discards (a parent ErrorBoundary throwing the
  // subtree away, a suspended first render) never commits and runs no cleanup, so the render
  // registration removes itself after a short wait if no commit followed. Each copy of the block
  // keeps its own updater: a native shell can show one page on two screens (engine createUpdaters).
  const updater = useRef(() => setUpdate((count) => count + 1)).current;
  const renderRegistration = useRef(null);
  const committed = useRef(false);
  const dropped = useRef(false);
  if (renderRegistration.current === null && !committed.current) {
    const unregister = context._internal.updaters.register(block.id, updater);
    const timer = setTimeout(() => {
      if (committed.current) return;
      unregister();
      dropped.current = true;
    }, RENDER_REGISTRATION_MS);
    renderRegistration.current = timer;
  }
  useEffect(() => {
    // The render registration is the same updater in the same set, so the commit keeps it and
    // only cancels the timer; this cleanup then owns its removal.
    const unregister = context._internal.updaters.register(block.id, updater);
    committed.current = true;
    clearTimeout(renderRegistration.current);
    renderRegistration.current = null;
    // A first commit later than the wait (a slow lazy load) missed any update sent in between.
    if (dropped.current) {
      dropped.current = false;
      setUpdate((count) => count + 1);
    }
    return () => {
      committed.current = false;
      unregister();
    };
  }, [block.id, context, updater]);

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
