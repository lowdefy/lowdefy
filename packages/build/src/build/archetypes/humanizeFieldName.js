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

// Turns a collection field name into a human label: "framework_id" -> "Framework",
// "created_at" -> "Created", "title" -> "Title". A trailing "_id" is dropped so a
// relation field reads as the entity it points at, not the raw key.
function humanizeFieldName(fieldName) {
  const withoutId = fieldName.replace(/_id$/, '');
  const words = withoutId.split(/[_\s]+/).filter((word) => word.length > 0);
  if (words.length === 0) return fieldName;
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default humanizeFieldName;
