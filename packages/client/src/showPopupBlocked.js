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

// Tells the user a link could not be opened: the browser blocked the new tab,
// or the host of an MCP App view refused to open the link.
function showPopupBlocked({ lowdefy }) {
  lowdefy._internal.displayMessage({
    content: lowdefy._internal.translate('client.popupBlocked'),
    status: 'info',
    duration: 10,
  });
}

export default showPopupBlocked;
