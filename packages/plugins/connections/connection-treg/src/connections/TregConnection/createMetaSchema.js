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

// X-Treg-Meta tags: up to five key=value pairs. treg keeps them in an append-only ledger,
// so it refuses keys and values it cannot store as they are (no "@", which would make a
// value look like an email).
function createMetaSchema({ owner }) {
  return {
    type: 'object',
    maxProperties: 5,
    description:
      'Tags sent as X-Treg-Meta, for per-customer usage and budgets: up to five pairs, keys of lowercase letters, digits and "_", values of letters, digits and ". _ - :".',
    propertyNames: {
      pattern: '^[a-z0-9_]{1,32}$',
    },
    additionalProperties: {
      type: ['string', 'integer'],
      pattern: '^[A-Za-z0-9._:-]{1,128}$',
      errorMessage: `${owner} "meta" values should be strings of up to 128 letters, digits or ". _ - :", or integers.`,
    },
    errorMessage: {
      type: `${owner} "meta" should be an object.`,
      maxProperties: `${owner} "meta" should have at most 5 tags.`,
      propertyNames: `${owner} "meta" keys should be 1 to 32 lowercase letters, digits or "_".`,
    },
  };
}

export default createMetaSchema;
