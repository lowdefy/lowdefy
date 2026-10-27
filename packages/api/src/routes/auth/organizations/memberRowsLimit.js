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

// Reading every member row a person holds: the adapter returns at most a
// default page of rows when asked for none, so ask for more than any one person
// holds and the read is one round trip in practice.
const MEMBER_ROWS_LIMIT = 1000;

export default MEMBER_ROWS_LIMIT;
