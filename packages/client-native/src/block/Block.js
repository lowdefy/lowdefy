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

// One block of the page: registers its updater with the engine, runs its mount events and draws
// it by category. The same flow as the web renderer's block container.
const Block = ({ block, Blocks, context, lowdefy, parentLoading }) => {
  const [updates, setUpdate] = useState(0);
  const loggedErrorsRef = useRef(new Set());
  context._internal.updaters[block.id] = () => setUpdate(updates + 1);

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
