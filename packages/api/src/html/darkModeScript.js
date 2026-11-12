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

import safeScriptJson from './safeScriptJson.js';

// Synchronous pre-hydration script setting the <html> background and
// color-scheme — prevents a mode-mismatch flash of the page and of browser
// chrome (scrollbars, form controls) on page load. Mirrors useDarkMode.js
// resolution order: configDarkMode → localStorage → prefers-color-scheme. The preference is
// kept under the app's storage key; a value under the bare key from before keys were kept per
// app is read until useDarkMode moves it.
function darkModeScript({ configColorMode, darkBg, lightBg, storageKey }) {
  return `(function(){var c=${safeScriptJson(configColorMode)};var db=${safeScriptJson(
    darkBg
  )};var lb=${safeScriptJson(lightBg)};var k=${safeScriptJson(
    storageKey
  )};var d;if(c==="dark")d=true;else if(c==="light")d=false;else{try{var p=localStorage.getItem(k);if(p===null)p=localStorage.getItem("lowdefy_darkMode");if(p==="dark")d=true;else if(p==="light")d=false;else d=window.matchMedia("(prefers-color-scheme:dark)").matches}catch(e){d=window.matchMedia("(prefers-color-scheme:dark)").matches}}var bg=d?db:lb;document.documentElement.style.colorScheme=d?"dark":"light";if(bg)document.documentElement.style.backgroundColor=bg})();`;
}

export default darkModeScript;
