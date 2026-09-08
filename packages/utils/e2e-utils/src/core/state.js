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

async function getState(page) {
  return page.evaluate(() => {
    const lowdefy = window.lowdefy;
    const pageId = lowdefy?.pageId;
    return lowdefy?.contexts?.[`page:${pageId}`]?.state;
  });
}

async function getBlockState(page, { blockId }) {
  const state = await getState(page);
  return state?.[blockId];
}

async function setState(page, { key, value }) {
  // context.methods.setState does not exist on engine contexts - the engine's
  // action layer (see createSetState.js) writes state via State.set() and then
  // triggers a re-render via context._internal.update().
  await page.evaluate(
    ({ k, v }) => {
      const lowdefy = window.lowdefy;
      const pageId = lowdefy?.pageId;
      const context = lowdefy?.contexts?.[`page:${pageId}`];
      context._internal.State.set(k, v);
      context._internal.update();
    },
    { k: key, v: value }
  );
}

export { getState, getBlockState, setState };
