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

import getContext from '@lowdefy/engine';
import { serializer } from '@lowdefy/helpers';

// Build and initialise a page's engine context BEFORE it is mounted in React,
// so the previous page stays visible and interactive while the next page's
// onInit (and its requests) run. getContext memoizes the context in
// lowdefy.contexts[id], so when React later mounts <Context> for this page it
// reuses this already-initialised context (onInitDone === true) and renders
// immediately — no blank frame. Only one React tree is ever mounted, so the
// shared lowdefy singletons are never contended.
//
// onInit errors are intentionally swallowed: the React mount re-runs runOnInit
// (onInitDone was never set) and surfaces the error via the ErrorBoundary,
// exactly as it does without prewarming.
async function prewarmPageContext({ pageConfig, jsMap, lowdefy }) {
  const config = serializer.deserialize(pageConfig);
  const context = getContext({ config, jsMap, lowdefy });
  try {
    await context._internal.runOnInit(() => {
      lowdefy._internal.progress.dispatch({ type: 'increment' });
    });
  } catch (e) {
    // Surfaced on mount via the ErrorBoundary.
  }
  return context;
}

export default prewarmPageContext;
