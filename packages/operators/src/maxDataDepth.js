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

// How deep data read into a Dynamic block's content may nest. The checks after
// the scan, and the serializer, walk data by recursion, so deeper data is
// refused with a clear error before it can exhaust the stack. Real records
// stay far below it (MongoDB caps documents at 100 levels).
const MAX_DATA_DEPTH = 200;

export default MAX_DATA_DEPTH;
