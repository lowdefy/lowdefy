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

// Grid-level feature hooks (virtualisation, keyboard, ...) in registry order. Each receives the
// grid context with the earlier hooks' results merged in (keyboard reads virtualisation's
// `range`). The registry is a module constant, so the hook order never changes between renders.
function useGridFeatures(gridCtx) {
  const ctx = gridCtx;
  ctx.api.features.list.forEach((feature) => {
    if (!feature.useGridFeature) return;
    Object.assign(ctx, feature.useGridFeature(ctx));
  });
  return ctx;
}

export default useGridFeatures;
