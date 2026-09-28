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
import { getMediaViewport } from '@lowdefy/operators';

// The media values a resize can change, as the _media operator reads them. Null where there is no
// browser window (server rendering, engine harnesses), where _media itself can not evaluate.
function readMediaViewport({ lowdefy }) {
  const window = lowdefy._internal.globals?.window;
  if (type.isNone(window?.innerWidth)) {
    return null;
  }
  return getMediaViewport({ window });
}

export default readMediaViewport;
