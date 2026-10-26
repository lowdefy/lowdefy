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

import {
  checkArray,
  checkKeys,
  checkObject,
  checkOptionalEnum,
  checkOptionalPath,
  checkString,
  checkUniqueIds,
} from './mobileChecks.js';

const WIDGET_KEYS = ['id', 'title', 'layout', 'endpointId', 'path'];
const LAYOUTS = ['count', 'list'];

// mobile.widgets: the sources a shell's Home Screen and Lock Screen widgets show. The person picks
// one when adding a widget; the shell fetches its endpoint and hands the answer to the layout.
function validateMobileWidgets({ widgets, configKey }) {
  const path = 'mobile.widgets';
  checkArray({ value: widgets, path, configKey });
  widgets.forEach((widget, index) => {
    const widgetPath = `${path}[${index}]`;
    checkObject({ value: widget, path: widgetPath, configKey });
    const key = widget['~k'] ?? configKey;
    checkKeys({ object: widget, allowed: WIDGET_KEYS, path: widgetPath, configKey: key });
    checkString({ value: widget.id, path: `${widgetPath}.id`, configKey: key });
    checkString({ value: widget.title, path: `${widgetPath}.title`, configKey: key });
    checkString({ value: widget.endpointId, path: `${widgetPath}.endpointId`, configKey: key });
    checkOptionalEnum({
      value: widget.layout,
      allowed: LAYOUTS,
      path: `${widgetPath}.layout`,
      configKey: key,
    });
    checkOptionalPath({ value: widget.path, path: `${widgetPath}.path`, configKey: key });
  });
  checkUniqueIds({ items: widgets, path, configKey });
}

export default validateMobileWidgets;
