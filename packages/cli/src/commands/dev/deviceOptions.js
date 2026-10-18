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

import { Option } from 'commander';

// The lowdefy dev flags that put the app on a phone: a simulator, an emulator
// or USB phone, or a phone paired over the local network.
const deviceOptions = {
  ios: new Option(
    '--ios',
    'Open the app in Lowdefy Dev on an iPhone simulator (macOS with Xcode). The Lowdefy Dev build comes from LOWDEFY_DEV_APP_IOS.'
  ),
  android: new Option(
    '--android',
    'Open the app in Lowdefy Dev on an Android emulator, or a phone connected by USB. The Lowdefy Dev build comes from LOWDEFY_DEV_APP_ANDROID.'
  ),
  lan: new Option(
    '--lan [interface]',
    'Let a phone on the local network pair by QR code. Listens on the first private address, or on the named network interface.'
  ),
};

export default deviceOptions;
