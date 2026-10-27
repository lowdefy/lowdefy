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

import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Shows a tab's own page on its tab. A route that lands a tab's page on another tab's stack (a
 * link the app is opened with, which the router matches in the first tab group) is closed, and
 * the page's tab is selected, so the tab bar shows the tab of the page on screen.
 *
 * @param {Object} props
 * @param {string} props.href The tab's router href (getTabHref).
 */
function SwitchToTab({ href }) {
  useEffect(() => {
    if (router.canDismiss()) router.dismiss();
    router.navigate(href);
  }, [href]);
  return null;
}

export default SwitchToTab;
