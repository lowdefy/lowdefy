/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2024 Lowdefy, Inc

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
import buildPage from './buildPage.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';

function buildPages({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  const checkDuplicatePageId = createCheckDuplicateId({
    message: 'Duplicate pageId "{{ id }}".',
  });
  pages.map((page, index) => buildPage({ page, index, context, checkDuplicatePageId }));
  return components;
}

export default buildPages;
