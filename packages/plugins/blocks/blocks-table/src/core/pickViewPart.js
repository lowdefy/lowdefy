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

import { type } from '@lowdefy/helpers';

// The brief's fallback rule for every top-level part of the view: the value's part, then the
// `defaultView` part. Column defaults are the caller's last fallback.
function pickViewPart({ value, defaultView, key }) {
  const fromValue = value?.view?.[key];
  if (!type.isUndefined(fromValue)) return fromValue;
  return defaultView?.[key];
}

export default pickViewPart;
