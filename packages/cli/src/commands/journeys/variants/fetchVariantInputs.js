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

import axios from 'axios';

async function getJson({ url, path }) {
  try {
    const response = await axios.get(`${url}${path}`, { timeout: 60000 });
    return response.data;
  } catch (error) {
    const status = error.response ? ` responded ${error.response.status}` : '';
    throw new Error(`GET ${path}${status}: ${error.message}`);
  }
}

// What the generators read from the dev server: the built config of every
// page the journey visited, the start page first, and the app's i18n.
async function fetchVariantInputs({ url, journey, exercised }) {
  const pageIds = [...new Set([journey.pageId, ...exercised.pages])];
  const pageConfigs = [];
  for (const pageId of pageIds) {
    pageConfigs.push(await getJson({ url, path: `/lowdefy-docs/page-config/${pageId}` }));
  }
  const root = await getJson({ url, path: '/api/root' });
  return { pageConfigs, i18n: root.i18n };
}

export default fetchVariantInputs;
