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

import { serializer, type } from '@lowdefy/helpers';

// Returns a status object so the page route can fork on the auth outcome:
// - ok: render the page.
// - not_found and unauthorized both collapse to the opaque /404 redirect -
//   wrong roles never reveal that the page exists.
// - unauthenticated: a logged-out human gets the authPages.signIn redirect
//   with a callbackUrl back to the requested page.
async function getPageConfig({ authorize, readConfigFile, user }, { pageId }) {
  const pageConfig = await readConfigFile(`pages/${pageId}.json`);
  if (!pageConfig) {
    return { status: 'not_found' };
  }
  if (authorize(pageConfig)) {
    // eslint-disable-next-line no-unused-vars
    const { auth, ...rest } = pageConfig;
    // Use serializer.serialize to ensure ~k keys (non-enumerable after deserialize)
    // are made enumerable again for JSON transfer to client
    return { status: 'ok', pageConfig: serializer.serialize(rest) };
  }
  if (type.isNone(user)) {
    return { status: 'unauthenticated' };
  }
  return { status: 'unauthorized' };
}

export default getPageConfig;
