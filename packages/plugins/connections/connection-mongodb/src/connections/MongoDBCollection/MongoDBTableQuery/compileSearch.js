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

import escapeRegex from './escapeRegex.js';

// Each search word must appear, case-insensitively, in at least one field marked
// search: true, so "ada love" finds "Ada Lovelace" across first and last name fields.
function compileSearch({ search, fieldsByKey }) {
  if (search === null) {
    return null;
  }
  const searchFields = [...fieldsByKey.values()].filter((field) => field.search);
  if (searchFields.length === 0) {
    throw new Error(
      'MongoDBTableQuery view has a search, but no field in "fields" has "search: true".'
    );
  }
  const terms = search.split(/\s+/).map((term) => {
    const regex = new RegExp(escapeRegex(term), 'i');
    if (searchFields.length === 1) {
      return { [searchFields[0].path]: regex };
    }
    return { $or: searchFields.map((field) => ({ [field.path]: regex })) };
  });
  if (terms.length === 1) {
    return terms[0];
  }
  return { $and: terms };
}

export default compileSearch;
