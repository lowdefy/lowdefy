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

// The value passed to an antd component's `disabled` prop. antd resolves it as
// `disabled ?? contextDisabled`, so an unset `properties.disabled` must stay undefined for
// ConfigProvider `componentDisabled` (and a disabled antd Form) to reach the block, while an
// explicit `false` still re-enables it inside a disabled ConfigProvider.
function getDisabled({ loading, properties }) {
  if (loading) return true;
  return properties.disabled;
}

export default getDisabled;
