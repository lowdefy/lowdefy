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

const COOKIE_NAME = 'lowdefy_e2e_user';

function getBaseURL(page) {
  return page.context()._options?.baseURL ?? 'http://localhost:3000';
}

async function setUserCookie(page, userObj) {
  const value = Buffer.from(JSON.stringify(userObj)).toString('base64');
  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value,
      url: getBaseURL(page),
    },
  ]);
}

async function clearUserCookie(page) {
  await page.context().clearCookies({ name: COOKIE_NAME });
}

export { setUserCookie, clearUserCookie };
