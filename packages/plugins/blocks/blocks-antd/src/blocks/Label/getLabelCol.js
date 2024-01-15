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

const getLabelCol = (value, inline) => {
  if (inline) {
    return { flex: '0 1 auto' };
  }
  const defaultVal = {
    xs: { span: 24 },
    sm: { span: 24 },
  };
  if (value.span) {
    defaultVal.md = { span: value.span };
  }
  if (value.sm) {
    defaultVal.sm = value.sm;
    defaultVal.xs = value.sm;
  }
  if (value.xs) {
    defaultVal.xs = value.xs;
  }
  if (value.md) {
    defaultVal.md = value.md;
  }
  if (value.lg) {
    defaultVal.lg = value.lg;
  }
  if (value.xl) {
    defaultVal.xl = value.xl;
  }
  if (value.xxl) {
    defaultVal.xxl = value.xxl;
  }
  return defaultVal;
};
export default getLabelCol;
