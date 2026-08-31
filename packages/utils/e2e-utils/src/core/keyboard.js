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

// A `mod` shortcut is resolved by tinykeys, which reads navigator.platform in the browser. That is
// the platform Playwright emulates for the project's device, not the one the test runner is on — a
// Desktop Chrome project reports Win32 even on macOS. Reading it from the page is what keeps the key
// a test presses the same key the app is listening for. Mirrors tinykeys' own check.
async function getShortcutModifier(page) {
  const isApple = await page.evaluate(() => /Mac|iPod|iPhone|iPad/.test(navigator.platform));
  return isApple ? 'Meta' : 'Control';
}

export { getShortcutModifier };
