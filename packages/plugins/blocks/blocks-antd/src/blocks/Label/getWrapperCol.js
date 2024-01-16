/*
  Copyright 2020-2024 Lowdefy, Inc

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

const getWrapperCol = (value, inline) => {
  if (inline) {
    return { flex: '1 1 auto' };
  }
  const defaultVal = {
    xs: { span: 24 },
    sm: { span: 24 },
  };
  if (value.span) {
    defaultVal.md = { span: 24 - value.span };
  }
  if (value.sm?.span) {
    defaultVal.sm = { span: 24 - value.sm.span };
    defaultVal.xs = { span: 24 - value.sm.span };
  }
  if (value.xs?.span) {
    defaultVal.xs = { span: 24 - value.xs.span };
  }
  if (value.md?.span) {
    defaultVal.md = { span: 24 - value.md.span };
  }
  if (value.lg?.span) {
    defaultVal.lg = { span: 24 - value.lg.span };
  }
  if (value.xl?.span) {
    defaultVal.xl = { span: 24 - value.xl.span };
  }
  if (value.xxl?.span) {
    defaultVal.xxl = { span: 24 - value.xxl.span };
  }
  return defaultVal;
};
export default getWrapperCol;
