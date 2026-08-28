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

import { useEffect, useRef } from 'react';

import { tinykeys } from 'tinykeys';

// Binds the global Cmd/Ctrl+/ feedback toggle, matching the app's own
// shortcut convention (see createShortcutManager.js): tinykeys on window,
// "$mod" for the platform modifier. Registered at capture phase with
// stopImmediatePropagation so the app's own shortcut manager (or any block
// event bound to the same key) never also fires.
function useFeedbackToggle({ onToggle }) {
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let unsubscribe;
    try {
      unsubscribe = tinykeys(
        window,
        {
          '$mod+Slash': (event) => {
            try {
              event.preventDefault();
              event.stopImmediatePropagation();
              if (onToggleRef.current) {
                onToggleRef.current();
              }
            } catch {
              // Never let the toggle handler crash the app.
            }
          },
        },
        { capture: true }
      );
    } catch {
      // tinykeys unavailable or binding failed — the feature just won't toggle.
    }

    return () => {
      try {
        if (unsubscribe) {
          unsubscribe();
        }
      } catch {
        // no-op
      }
    };
  }, []);
}

export default useFeedbackToggle;
