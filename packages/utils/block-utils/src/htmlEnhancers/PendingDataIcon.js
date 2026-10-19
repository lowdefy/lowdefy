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

import labelIcon from './labelIcon.js';

// A data-icon name the page's icons lack may be one of the app's. It renders
// nothing until every icon has loaded, then the icon, or nothing and a warning
// when the name is still unknown (markup may use data-icon for something else).
function PendingDataIcon({ element, Icon, icons, loadAllIcons, name }) {
  const [settled, setSettled] = useState(false);
  const known = settled && Object.hasOwn(icons, name);

  useEffect(() => {
    let mounted = true;
    // A failed load is logged by the loader; the name stays unknown.
    loadAllIcons()
      .catch(() => undefined)
      .then(() => {
        if (mounted) setSettled(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!settled) return;
    if (known) {
      labelIcon(element);
      return;
    }
    console.warn(`data-icon="${name}" is not a known icon, so nothing was rendered.`);
  }, [settled]);

  if (!known) return null;
  return <Icon properties={{ name, title: '' }} />;
}

export default PendingDataIcon;
