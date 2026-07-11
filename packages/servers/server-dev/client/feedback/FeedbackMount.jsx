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

import React, { Suspense, useEffect, useState } from 'react';

// Side effect only: installs the console ring-buffer patch as soon as this
// module is imported, regardless of whether the overlay ever activates.
import './consoleBuffer.js';
import useFeedbackToggle from './useFeedbackToggle.js';

// Logged once per page load, not once per mount — React StrictMode / HMR can
// remount this component without a real reload.
let bannerLogged = false;

function logBannerOnce() {
  if (bannerLogged) {
    return;
  }
  bannerLogged = true;
  try {
    // eslint-disable-next-line no-console
    console.info(
      '%cLowdefy Annotate%c — press Cmd/Ctrl+/ to point, draw, and copy annotations for your coding agent.',
      'color: #4f9cf9; font-weight: bold;',
      'color: inherit;'
    );
  } catch {
    // Never let a console-styling quirk break the app.
  }
}

// Code-split: the overlay (state machine, drawing SVG, review tray) only
// loads once the developer actually opts in.
const LazyOverlay = React.lazy(() => import('./FeedbackOverlay.jsx'));

// Dev-only, always mounted alongside Inspector.jsx. Mirrors its resilience
// contract — nothing here may ever throw into the app it's riding along
// with. Stays inert until the developer presses Cmd/Ctrl+/, at which point
// the overlay mounts.
function FeedbackMount({ basePath, lowdefy, pageId }) {
  const [active, setActive] = useState(false);

  useFeedbackToggle({
    onToggle: () => setActive((current) => !current),
  });

  useEffect(() => {
    logBannerOnce();
  }, []);

  return (
    <>
      {active && (
        <Suspense fallback={null}>
          <LazyOverlay
            basePath={basePath}
            lowdefy={lowdefy}
            pageId={pageId}
            onClose={() => setActive(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default FeedbackMount;
