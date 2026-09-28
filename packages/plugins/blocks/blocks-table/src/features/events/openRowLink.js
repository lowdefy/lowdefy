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

import { getHtmlEnhancements } from '@lowdefy/block-utils';
import resolveLink from '@lowdefy/blocks-antd/table/resolveLink.js';

// The client registers the same link function the Link action uses, so rowLink gets router
// navigation, page input and new tabs exactly as a Link (and TableLight's rowLink) does.
function openRowLink({ rowLink, row, newTab }) {
  const link = resolveLink({ link: rowLink, row });
  getHtmlEnhancements().link({ ...link, newTab: newTab === true || link.newTab === true });
}

export default openRowLink;
