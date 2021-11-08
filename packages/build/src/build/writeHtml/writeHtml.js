/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { get, type } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import template from './template.js';

const templateFn = nunjucksFunction(template);

function pageHtml({ context, page }) {
  return templateFn({
    LOWDEFY_VERSION: context.version,
    LOWDEFY_PAGE_ID: page.pageId,
    // TODO: Don't use properties.title since it might be an operator
    LOWDEFY_PAGE_TITLE: get(page, 'properties.title', { default: 'Lowdefy App' }),
    LOWDEFY_SERVER_BASE_PATH: get(context, 'serverBasePath', { default: '' }),
    // TODO: Implement
    LOWDEFY_APP_HEAD_HTML: '',
    LOWDEFY_PAGE_HEAD_HTML: '',
    LOWDEFY_APP_BODY_HTML: '',
    LOWDEFY_PAGE_BODY_HTML: '',
  });
}

async function writePageHtml({ context, page, templateFn }) {
  await context.writeBuildArtifact({
    filePath: `static/${page.pageId}.html`,
    content: pageHtml({ context, page, templateFn }),
  });
}

async function writeHtml({ components, context }) {
  if (type.isNone(components.pages)) return;
  const writePromises = components.pages.map((page) => writePageHtml({ context, page }));
  return Promise.all(writePromises);
}

export { pageHtml };

export default writeHtml;
