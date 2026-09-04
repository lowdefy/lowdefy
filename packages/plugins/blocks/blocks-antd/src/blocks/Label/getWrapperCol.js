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

const getWrapperCol = (properties, inline) => {
  if (inline) {
    return { flex: '1 1 auto' };
  }
  const wrapperCol = {
    xs: { span: 24 },
    sm: { span: 24 },
  };
  if (properties.span) {
    wrapperCol.md = { span: 24 - properties.span };
  }
  return wrapperCol;
};
export default getWrapperCol;
