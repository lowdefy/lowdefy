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

// Create a container element for antd's CSS-in-JS injection that is positioned
// AFTER the @layer order declaration in <head>. Without this, antd's StyleProvider
// prepends <style> tags to the top of <head>, placing them before the @layer
// declaration and breaking the cascade layer priority (antd becomes lowest instead
// of overriding Tailwind's preflight).
function getOrCreateAntdCssContainer() {
  if (typeof document === 'undefined') return undefined;
  const existing = document.getElementById('__antd-css-container');
  if (existing) return existing;
  const anchor = document.getElementById('__lf-layer-order');
  if (!anchor) return undefined;
  const container = document.createElement('div');
  container.id = '__antd-css-container';
  anchor.after(container);
  return container;
}

export default getOrCreateAntdCssContainer;
