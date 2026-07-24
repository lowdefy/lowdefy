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

import React, { useEffect, useState } from 'react';

const MountEvents = ({ children, context, pageId, triggerEvent, triggerEventAsync }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true);
    const mount = async () => {
      try {
        await triggerEvent();
        triggerEventAsync();
        setLoading(false);
      } catch (err) {
        setError(err);
      }
    };
    mount();
  }, [context]);

  // Expose bare readiness globals for external capture tooling (e.g. headless
  // PDF rendering), following the __lowdefy_isDark precedent in useDarkMode.js.
  // Write-only from the app's perspective — no config, no API surface.
  // page_ready mirrors the page loading lifecycle: false during mount/init and
  // on navigation to another page, true once onInit has completed and the
  // loading skeleton tears down. window.lowdefy only exists in dev/e2e, so
  // production capture tooling reads the current pageId from here.
  window.__lowdefy_page_id = pageId;
  window.__lowdefy_page_ready = !loading;

  if (error) throw error;

  return <>{children(loading)}</>;
};

export default MountEvents;
