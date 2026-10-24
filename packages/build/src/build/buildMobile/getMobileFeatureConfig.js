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

import { type } from '@lowdefy/helpers';

// mobile.share, widgets, shortcuts and background as plain objects with every default written:
// null for no share page and no background fetch, a count layout for a widget with none, and no
// path for a shortcut or widget that names none.
function getMobileFeatureConfig({ mobile }) {
  return {
    share: type.isObject(mobile.share) ? { pageId: mobile.share.pageId } : null,
    widgets: (mobile.widgets ?? []).map((widget) => ({
      id: widget.id,
      title: widget.title,
      layout: widget.layout ?? 'count',
      endpointId: widget.endpointId,
      path: widget.path ?? null,
    })),
    shortcuts: (mobile.shortcuts ?? []).map((shortcut) => ({
      id: shortcut.id,
      title: shortcut.title,
      subtitle: shortcut.subtitle ?? null,
      icon: shortcut.icon ?? null,
      path: shortcut.path ?? null,
    })),
    background: type.isObject(mobile.background)
      ? { endpointId: mobile.background.endpointId, interval: mobile.background.interval ?? 15 }
      : null,
  };
}

export default getMobileFeatureConfig;
