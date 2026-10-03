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

const { default: renderDevPage } = await import('./renderDevPage.js');
const { JOURNEY_COOKIES, writeJourneyCookie } = await import('../../lib/server/journeyCookies.js');

function render({ cookie } = {}) {
  let html;
  const c = {
    get: () => undefined,
    req: { header: (name) => (name === 'cookie' ? cookie : undefined) },
    html: (value) => {
      html = value;
      return value;
    },
  };
  renderDevPage(c, { basePath: '' });
  const match = /<script id="__LOWDEFY_CONFIG__" type="application\/json">(.*?)<\/script>/.exec(
    html
  );
  return JSON.parse(match[1]);
}

afterEach(() => {
  delete process.env.LOWDEFY_DEV_RECORD;
});

test('renderDevPage enables recording in a developer tab by default', () => {
  expect(render().recording).toEqual({ enabled: true });
});

test('renderDevPage disables recording for a context whose recording cookie is off', () => {
  const written = writeJourneyCookie({
    name: JOURNEY_COOKIES.recording.name,
    payload: 'off',
    origin: 'http://localhost:3001',
  });
  expect(render({ cookie: `${written.name}=${written.value}` }).recording).toEqual({
    enabled: false,
  });
});

test('renderDevPage disables recording when LOWDEFY_DEV_RECORD is false', () => {
  process.env.LOWDEFY_DEV_RECORD = 'false';
  expect(render().recording).toEqual({ enabled: false });
});
