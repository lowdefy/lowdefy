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

// Map validation.status → wrapper class. Matches the visual behavior of
// passing status="error" | "warning" to an antd <Input />, but rendered
// with our own CSS (see utils/style.module.css) because antd v6 uses
// CSS-in-JS, so the .ant-input-status-* classes are not global.
function statusClass(status) {
  if (status === 'error') return 'tiptap-wrapper-error';
  if (status === 'warning') return 'tiptap-wrapper-warning';
  return '';
}

export default statusClass;
