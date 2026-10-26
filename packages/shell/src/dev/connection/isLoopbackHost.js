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

// A host on this device: a simulator's localhost is the Mac's, and a USB Android phone's is the
// computer's through adb reverse. Neither reaches a server on a network.
function isLoopbackHost(host) {
  const hostname = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
  const name = hostname.toLowerCase();
  return name === 'localhost' || name === '[::1]' || /^127\.\d+\.\d+\.\d+$/.test(name);
}

export default isLoopbackHost;
