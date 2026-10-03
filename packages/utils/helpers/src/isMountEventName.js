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

const MOUNT_EVENT_NAMES = ['onInit', 'onInitAsync', 'onMount', 'onMountAsync'];

// Mount-class events fire by themselves when a page or block opens, so no DOM
// interaction ever causes one. The pairing rule and the journey compiler both
// need to tell them apart, and must agree on the list.
function isMountEventName({ eventName }) {
  return MOUNT_EVENT_NAMES.includes(eventName);
}

export default isMountEventName;
