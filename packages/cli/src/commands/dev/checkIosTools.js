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

import runDeviceTool from './runDeviceTool.js';

const INSTALL_XCODE =
  'The iOS simulator needs Xcode. Install it from the App Store (https://apps.apple.com/app/xcode/id497799835), open it once so it installs the iOS simulator, then run: sudo xcode-select --switch /Applications/Xcode.app';

async function checkIosTools({ platform = process.platform } = {}) {
  if (platform !== 'darwin') {
    throw new Error(
      'The iOS simulator runs only on macOS. Use --android, or --lan to pair a phone.'
    );
  }
  try {
    await runDeviceTool({ command: 'xcrun', args: ['--find', 'simctl'] });
  } catch (error) {
    // xcrun itself is missing, or only the Command Line Tools are installed:
    // xcrun then reports that it cannot find simctl.
    throw new Error(INSTALL_XCODE, { cause: error });
  }
}

export default checkIosTools;
