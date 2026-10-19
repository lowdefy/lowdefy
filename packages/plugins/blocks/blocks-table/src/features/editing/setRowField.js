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

import { serializer, set } from '@lowdefy/helpers';

// A copy of the row with one field (a dot path) set. Rows can be frozen engine state, and the
// same row object may be shared by an undo snapshot, so a row is never written in place.
function setRowField({ row, field, value }) {
  const next = serializer.copy(row ?? {});
  set(next, field, serializer.copy(value));
  return next;
}

export default setRowField;
