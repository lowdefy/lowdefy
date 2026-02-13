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

function formatUiMessage(messageOrObj) {
  if (typeof messageOrObj === 'string') return messageOrObj;
  if (messageOrObj?.print && typeof messageOrObj.print === 'function') {
    return messageOrObj.print();
  }
  if (messageOrObj && (messageOrObj.name || messageOrObj.message !== undefined)) {
    const name = messageOrObj.name || 'Error';
    const message = messageOrObj.message ?? '';
    return `[${name}] ${message}`;
  }
  return String(messageOrObj);
}

export default formatUiMessage;
