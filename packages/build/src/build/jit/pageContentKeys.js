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

// Keys stripped from pages after createPageRegistry captures the page file ref.
// Only `id`, `type` (and skeleton-computed `pageId`, `auth`, `~k`, `~r`) survive.
// `type` is always a resolved string (never a ref target) and must stay on stubs
// for schema validation (block schema requires both `id` and `type`).
const PAGE_CONTENT_KEYS = ['blocks', 'areas', 'events', 'requests', 'layout'];

export default PAGE_CONTENT_KEYS;
