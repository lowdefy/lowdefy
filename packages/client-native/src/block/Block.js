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

import CategorySwitch from './CategorySwitch.js';
import ErrorBoundary from './ErrorBoundary.js';
import MountEvents from '../MountEvents.js';

// How long a render's registration waits for a commit before it is dropped.
const RENDER_REGISTRATION_MS = 1000;

// One block of the page: registers its updater with the engine, runs its mount events and draws
// it by category. The same flow as the web renderer's block container.
const Block = ({ block, Blocks, context, lowdefy, parentLoading }) => {
  const [updates, setUpdate] = useState(0);
  const loggedErrorsRef = useRef(new Set());
  // The block's one updater for this component's life, as the web renderer's: the engine can
  // update a block before its first commit, so it registers on render too, and the effect takes
  // that registration over. A render React discards never commits and runs no cleanup, so the
  // render registration removes itself after a short wait if no commit followed. A native shell
  // can show one page on two screens, and each copy keeps its own updater (engine createUpdaters).
  const updater = useRef(() => setUpdate((count) => count + 1)).current;
  const renderRegistration = useRef(null);
  const committed = useRef(false);
  const dropped = useRef(false);
  if (renderRegistration.current === null && !committed.current) {
    const unregister = context._internal.updaters.register(block.id, updater);
    renderRegistration.current = setTimeout(() => {
      if (committed.current) return;
      unregister();
      dropped.current = true;
    }, RENDER_REGISTRATION_MS);
  }
  useEffect(() => {
    const unregister = context._internal.updaters.register(block.id, updater);
    committed.current = true;
    clearTimeout(renderRegistration.current);
    renderRegistration.current = null;
    // A first commit later than the wait missed any update sent in between.
    if (dropped.current) {
      dropped.current = false;
      setUpdate((count) => count + 1);
    }
    return () => {
      committed.current = false;
      unregister();
    };
  }, [block.id, context, updater]);

  const progress = () => {
    lowdefy._internal.progress.dispatch({ type: 'increment' });
  };

  // Parse errors are logged once each, not on every evaluation.
  useEffect(() => {
    (block.eval?.parseErrors ?? []).forEach((error) => {
      const errorKey = `${block.id}:${error.message}`;
      if (!loggedErrorsRef.current.has(errorKey)) {
        loggedErrorsRef.current.add(errorKey);
        lowdefy._internal.handleError(error);
      }
    });
  }, [block.eval?.parseErrors, block.id, lowdefy._internal]);

  return (
    <ErrorBoundary
      blockId={block.blockId}
      blockType={block.type}
      configKey={block.eval?.configKey}
      onError={lowdefy._internal.handleError}
      properties={block.eval?.properties}
    >
      <MountEvents
        context={context}
        triggerEvent={async () => {
          lowdefy._internal.progress.dispatch({ type: 'increment-on-mount', id: block.id });
          await block.triggerEvent({ name: 'onMount', progress });
        }}
        triggerEventAsync={() => {
          block.triggerEvent({ name: 'onMountAsync', progress });
          lowdefy._internal.progress.dispatch({ type: 'done' });
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
