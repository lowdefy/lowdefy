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

function isInPopoverContent(element) {
  return element.closest('[data-popover-content]') !== null;
}

// Runs each enhancer's prepare step over freshly sanitised HTML. Popover
// content is left to the nested HtmlComponent that shows it, so select() skips
// it. Returns the portals to render (keys prefixed with the enhancer name), the cleanups to call before the next
// apply, and each enhancer's other results by name for its event handlers.
function runHtmlEnhancers({ dataEvents, enhancers, registration, root }) {
  function select(selector) {
    return [...root.querySelectorAll(selector)].filter((element) => !isInPopoverContent(element));
  }
  const portals = [];
  const cleanups = [];
  const prepared = {};
  enhancers.forEach((enhancer) => {
    if (!enhancer.prepare) return;
    const {
      cleanup,
      portals: enhancerPortals,
      ...data
    } = enhancer.prepare({ dataEvents, registration, root, select }) ?? {};
    (enhancerPortals ?? []).forEach((portal) => {
      portals.push({ ...portal, key: `${enhancer.name}:${portal.key}` });
    });
    if (cleanup) cleanups.push(cleanup);
    prepared[enhancer.name] = data;
  });
  return { cleanups, portals, prepared };
}

export default runHtmlEnhancers;
