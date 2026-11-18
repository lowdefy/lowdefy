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

// Synchronous script that creates the @layer order declaration and keeps it as
// the first child of <head> via MutationObserver. antd's CSS-in-JS uses
// prependQueue to inject <style> tags at the top of <head>, which would
// otherwise make @layer antd the first (lowest priority) layer.
// MutationObserver fires before paint, so the browser never sees the wrong
// cascade order. The style element takes the script's own nonce, which a
// Content-Security-Policy needs to apply it.
const layerOrderScript = `(function(){var s=document.createElement("style");s.id="__lf-layer-order";var n=document.currentScript&&document.currentScript.nonce;if(n)s.nonce=n;s.textContent="@layer theme, base, antd, components, utilities;";document.head.prepend(s);new MutationObserver(function(){if(document.head.firstChild!==s)document.head.prepend(s)}).observe(document.head,{childList:true})})();`;

export default layerOrderScript;
