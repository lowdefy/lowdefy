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

import { expect } from '@playwright/test';

async function expectUrl(page, { pattern, path, timeout = 5000 }) {
  if (pattern) {
    await expect(page).toHaveURL(pattern, { timeout });
  } else if (path) {
    await expect(page).toHaveURL(path, { timeout });
  }
}

async function expectUrlQuery(page, { key, value, timeout = 5000 }) {
  await expect
    .poll(
      async () => {
        const url = new URL(page.url());
        return url.searchParams.get(key);
      },
      { timeout }
    )
    .toBe(value);
}

async function setUrlQuery(page, { key, value }) {
  await page.evaluate(
    ({ k, v }) => {
      const url = new URL(window.location.href);
      if (v === null || v === undefined) {
        url.searchParams.delete(k);
      } else {
        url.searchParams.set(k, v);
      }
      window.history.pushState({}, '', url);
    },
    { k: key, v: value }
  );
}

export { expectUrl, expectUrlQuery, setUrlQuery };
