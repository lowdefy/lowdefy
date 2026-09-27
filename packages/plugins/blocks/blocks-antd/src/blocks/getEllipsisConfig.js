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

const ELLIPSIS_KEYS = ['rows', 'expandable', 'defaultExpanded', 'suffix', 'tooltip'];

// antd spreads the ellipsis object over its defaults, so a key set to undefined erases the
// default. An undefined symbol, for example, renders an expand button with no text.
function getEllipsisConfig({ ellipsis, methods }) {
  if (!type.isObject(ellipsis)) {
    return ellipsis;
  }
  const config = {
    onExpand: (_, { expanded }) => {
      methods.triggerEvent({ name: 'onExpand', event: { expanded } });
    },
  };
  ELLIPSIS_KEYS.forEach((key) => {
    if (!type.isNone(ellipsis[key])) {
      config[key] = ellipsis[key];
    }
  });
  if (type.isArray(ellipsis.symbol)) {
    config.symbol = (expanded) => (expanded ? ellipsis.symbol[1] : ellipsis.symbol[0]);
  } else if (!type.isNone(ellipsis.symbol)) {
    config.symbol = ellipsis.symbol;
  }
  return config;
}

export default getEllipsisConfig;
