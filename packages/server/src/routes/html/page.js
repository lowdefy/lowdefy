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

import path from 'path';
import { get } from '@lowdefy/helpers';
import { clientDirectory } from '@lowdefy/client';
import { readFile } from '@lowdefy/node-utils';

// TODO:  redirect to 404
async function page(request, reply) {
  const { pageId } = request.params;
  let indexHtml = await readFile(path.resolve(clientDirectory, 'index.html'));
  console.log('clientDirectory', clientDirectory);
  console.log('indexHtml', indexHtml);
  let appConfig = await readFile(path.resolve('./.lowdefy/build', 'app.json'));
  appConfig = JSON.parse(appConfig);
  indexHtml = indexHtml.replace(
    '<!-- __LOWDEFY_APP_HEAD_HTML__ -->',
    get(appConfig, 'html.appendHead', { default: '' })
  );
  indexHtml = indexHtml.replace(
    '<!-- __LOWDEFY_APP_BODY_HTML__ -->',
    get(appConfig, 'html.appendBody', { default: '' })
  );
  indexHtml = indexHtml.replace(/__LOWDEFY_SERVER_BASE_PATH__/g, '');
  indexHtml = indexHtml.replace(/__LOWDEFY_PAGE_ID__/g, pageId);
  reply.type('text/html');
  reply.send(indexHtml);
}

export default page;
