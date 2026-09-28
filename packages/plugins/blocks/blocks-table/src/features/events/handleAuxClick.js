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

import isControlTarget from '@lowdefy/blocks-antd/table/isControlTarget.js';

import getBodyTarget from './getBodyTarget.js';
import openRowLink from './openRowLink.js';

// Middle click opens the row link in a new tab, like a middle-clicked link.
function handleAuxClick(event, api) {
  if (event.button !== 1 || !api.config.rowLink) return false;
  const target = getBodyTarget({ event, api });
  if (!target) return false;
  if (isControlTarget({ target: event.target, container: target.rowElement })) return false;
  event.preventDefault();
  openRowLink({ rowLink: api.config.rowLink, row: target.row.original, newTab: true });
  return true;
}

export default handleAuxClick;
