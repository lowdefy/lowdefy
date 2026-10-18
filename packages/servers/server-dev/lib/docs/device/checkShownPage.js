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

function pathParamsMatch({ requested, shown }) {
  if (type.isNone(requested)) {
    return true;
  }
  return Object.keys(requested).every((key) => String(requested[key]) === shown?.[key]);
}

/**
 * Whether a phone shows the page a tool names: undefined when it does, else the message the
 * agent gets. A phone is navigated on the phone (or by the app's own Link actions a click step
 * runs), so a tool acting on what it shows checks the page first rather than capture another one.
 *
 * @param {Object} params
 * @param {Object} params.tab The phone's tab.
 * @param {string} params.pageId
 * @param {Object} [params.pathParams]
 */
function checkShownPage({ tab, pageId, pathParams }) {
  const shown = tab.page;
  if (type.isNone(shown)) {
    return `The phone on tab "${tab.id}" shows no page yet. Open page "${pageId}" in Lowdefy Dev first.`;
  }
  if (
    shown.pageId === pageId &&
    pathParamsMatch({ requested: pathParams, shown: shown.pathParams })
  ) {
    return undefined;
  }
  return `The phone on tab "${tab.id}" shows page "${shown.pageId}"${
    Object.keys(shown.pathParams ?? {}).length > 0 ? ` ${JSON.stringify(shown.pathParams)}` : ''
  }, not "${pageId}"${
    type.isNone(pathParams) ? '' : ` ${JSON.stringify(pathParams)}`
  }. A phone is not navigated by the tools: pass pageId "${
    shown.pageId
  }", or open the page on the phone (or click a link to it in steps first, in lowdefy_run_journey).`;
}

export default checkShownPage;
