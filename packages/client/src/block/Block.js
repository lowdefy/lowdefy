/*
  Copyright 2020-2024 Lowdefy, Inc

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
import validateBlockProperties from './validateBlockProperties.js';

const Block = ({ block, Blocks, context, lowdefy, parentLoading }) => {
  const [updates, setUpdate] = useState(0);
  const loggedErrorsRef = useRef(new Set());
  lowdefy._internal.updaters[block.id] = () => setUpdate(updates + 1);

  const handleError = (error) => {
    if (lowdefy._internal.logError) {
      lowdefy._internal.logError(error);
    }
    validateBlockProperties({ block, lowdefy });
  };

  // Log parse errors to server
  useEffect(() => {
    if (block.eval?.parseErrors && lowdefy._internal.logError) {
      block.eval.parseErrors.forEach((error) => {
        // Use error message as key to avoid duplicate logs
        const errorKey = `${block.id}:${error.message}`;
        if (!loggedErrorsRef.current.has(errorKey)) {
          loggedErrorsRef.current.add(errorKey);
          lowdefy._internal.logError(error);
        }
      });
    }
  }, [block.eval?.parseErrors, block.id, lowdefy._internal]);

  return (
    <ErrorBoundary blockId={block.blockId} configKey={block.eval?.configKey} onError={handleError}>
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
