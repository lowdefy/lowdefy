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

import { useEffect, useReducer, useRef } from 'react';

// A block not yet evaluated counts as visible, as CategorySwitch waits for its evaluation.
function getVisibleSlots(slots) {
  return Object.keys(slots)
    .filter((slotKey) => slots[slotKey].blocks.some((block) => block.eval?.visible !== false))
    .join(',');
}

/**
 * The keys of a container's slots that hold a visible block, comma-joined. A slot whose blocks are
 * all hidden draws nothing, so a block that frames a slot (a header's glass button, a footer bar)
 * is not drawn around nothing. The container renders again only when a slot's blocks become all
 * hidden or one shows: it listens to its slots' blocks through the engine's updaters, which run
 * whether or not the blocks are mounted.
 *
 * @param {Object} params
 * @param {Object} params.context The page context, whose updaters the blocks report to.
 * @param {Object} params.slots The container's slots: `{ [slotKey]: { blocks } }`.
 * @returns {Set<string>} The keys of the slots with a visible block.
 */
function useVisibleSlots({ context, slots }) {
  const visibleSlots = getVisibleSlots(slots);
  const renderedRef = useRef(visibleSlots);
  renderedRef.current = visibleSlots;
  const [, rerender] = useReducer((count) => count + 1, 0);
  useEffect(() => {
    const update = () => {
      if (getVisibleSlots(slots) !== renderedRef.current) rerender();
    };
    const unregister = Object.values(slots).flatMap(({ blocks }) =>
      blocks.map((block) => context._internal.updaters.register(block.id, update))
    );
    // A block evaluated between the render and this effect has no updater to report it to.
    update();
    return () => unregister.forEach((remove) => remove());
  }, [context, slots]);
  return new Set(visibleSlots === '' ? [] : visibleSlots.split(','));
}

export default useVisibleSlots;
