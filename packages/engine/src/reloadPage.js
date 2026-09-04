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

import { type } from '@lowdefy/helpers';

// A page keeps its context and its mounted blocks across navigations, so a Link
// to the page already open renders nothing new and the mount chains never fire
// again. `reload: true` runs exactly the events a fresh mount runs: onMount on
// every block on the page, awaited, then onMountAsync, the order the client's
// MountEvents uses.
async function reloadPage({ lowdefy }) {
  const context = lowdefy.contexts[`page:${lowdefy.pageId}`];
  // A link can be followed before the page it names has ever rendered (an
  // initial server render, a link in a menu rendered above the page), and then
  // there are no mounted blocks to re-run.
  if (type.isNone(context)) return;
  const { dispatch } = lowdefy._internal.progress;
  const progress = () => dispatch({ type: 'increment' });
  const blocks = Object.values(context._internal.RootSlots.map);
  blocks.forEach((block) => dispatch({ type: 'increment-on-mount', id: block.id }));
  await Promise.all(blocks.map((block) => block.triggerEvent({ name: 'onMount', progress })));
  blocks.forEach((block) => {
    block.triggerEvent({ name: 'onMountAsync', progress });
    dispatch({ type: 'done' });
  });
}

export default reloadPage;
