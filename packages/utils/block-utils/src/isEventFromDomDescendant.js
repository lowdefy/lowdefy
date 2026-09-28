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

// React bubbles events through the component tree, so a click inside a portal (a Modal, a Drawer,
// a dropdown) also reaches the block that renders it, although the portal's DOM sits elsewhere in
// the document. A block's own events should only fire for DOM it contains.
function isEventFromDomDescendant(event) {
  return event.currentTarget.contains(event.target);
}

export default isEventFromDomDescendant;
