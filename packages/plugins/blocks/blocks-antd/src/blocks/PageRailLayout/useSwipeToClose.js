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

import { useRef } from 'react';

import capturePointer from './capturePointer.js';
import getFlickVelocity from './getFlickVelocity.js';
import releasePointer from './releasePointer.js';

// A horizontal move this far, and clearly more horizontal than vertical, starts a swipe.
const START_DISTANCE = 10;
// Letting go past this share of the drawer's width, or flicking faster than this many pixels
// per millisecond, closes it; otherwise it springs back.
const CLOSE_SHARE = 0.3;
const CLOSE_VELOCITY = 0.45;

// Pointer handlers that let a finger drag an open drawer back towards its edge. `direction` is -1
// for a drawer that closes to the left and 1 for one that closes to the right. Vertical moves are
// left to the browser, so the drawer's own list still scrolls.
function useSwipeToClose({ direction = -1, enabled, onClose, rootRef, target }) {
  const swipe = useRef(null);

  function reset(element) {
    element.style.removeProperty('transform');
    element.style.removeProperty('transition');
    rootRef.current?.style.removeProperty('--lf-rail-scrim-progress');
    rootRef.current?.removeAttribute('data-swiping');
  }

  return {
    onPointerDown: (event) => {
      if (!enabled || event.pointerType === 'mouse') return;
      swipe.current = { x: event.clientX, y: event.clientY, active: false, samples: [] };
    },
    onPointerMove: (event) => {
      const current = swipe.current;
      if (!current) return;
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      const element = target.current;
      if (!element) return;
      if (!current.active) {
        if (Math.abs(dy) > START_DISTANCE && Math.abs(dy) > Math.abs(dx)) {
          swipe.current = null;
          return;
        }
        if (dx * direction < START_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        current.active = true;
        current.width = element.getBoundingClientRect().width;
        capturePointer(element, event.pointerId);
        element.style.transition = 'none';
        rootRef.current?.setAttribute('data-swiping', 'true');
      }
      const offset = direction < 0 ? Math.min(0, dx) : Math.max(0, dx);
      current.offset = offset;
      current.samples.push({ offset, t: event.timeStamp });
      element.style.transform = `translateX(${offset}px)`;
      rootRef.current?.style.setProperty(
        '--lf-rail-scrim-progress',
        String(1 - Math.abs(offset) / current.width)
      );
    },
    onPointerUp: (event) => {
      const current = swipe.current;
      swipe.current = null;
      const element = target.current;
      if (!current?.active || !element) return;
      releasePointer(element, event.pointerId);
      const velocity = getFlickVelocity({ samples: current.samples, now: event.timeStamp });
      const close =
        Math.abs(current.offset ?? 0) > current.width * CLOSE_SHARE ||
        velocity * direction > CLOSE_VELOCITY;
      reset(element);
      if (close) onClose('swipe');
    },
    onPointerCancel: () => {
      const element = target.current;
      if (swipe.current?.active && element) reset(element);
      swipe.current = null;
    },
  };
}

export default useSwipeToClose;
