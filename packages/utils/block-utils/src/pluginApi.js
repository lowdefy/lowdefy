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

// The public plugin API is documented in code-docs/architecture/plugin-api.md.
// PLUGIN_API_VERSION increments only when a documented member of that API is
// removed or its contract changes; additions do not bump it.
const PLUGIN_API_VERSION = 1;

// Block methods that used to be on the `methods` prop and no longer exist.
// The client wraps the methods bag in a proxy (createBlockMethods) that throws
// a located BlockError with this text when a block reaches for one, so the
// failure names the removal and the replacement instead of a bare TypeError.
const REMOVED_BLOCK_METHODS = {
  makeCssClass:
    "Blocks receive resolved class names on the `classNames` prop and style objects on the `styles` prop, keyed by the block's `meta.cssKeys`. Replace `methods.makeCssClass(x)` with `classNames.<cssKey>` or an inline `style` object. See the codemod at @lowdefy/codemods v8-0-0/02-removed-block-methods.md.",
};

export { PLUGIN_API_VERSION, REMOVED_BLOCK_METHODS };
