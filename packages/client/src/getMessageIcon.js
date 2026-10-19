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

// Engine and DisplayMessage messages render through antd's App holders, above
// the page's ConfigProvider, so each message carries its status icon itself.
const messageIcons = {
  error: { name: 'error', title: '' },
  info: { name: 'info', title: '' },
  loading: { name: 'loading', spin: true, title: '' },
  success: { name: 'success', title: '' },
  warning: { name: 'warning', title: '' },
};

function getMessageIcon({ status }) {
  return messageIcons[status];
}

export default getMessageIcon;
