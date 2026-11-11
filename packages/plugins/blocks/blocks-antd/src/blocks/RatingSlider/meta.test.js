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

import { formatSchemaError, getConfigSchemaErrors } from '@lowdefy/ajv';
import { expect, test } from 'vitest';

import meta from './meta.js';

// The build's plugin-schema check judges block properties this way.
function check(properties) {
  return getConfigSchemaErrors({ schema: meta.properties, data: properties }).map((ajvError) =>
    formatSchemaError({
      ajvError,
      pluginLabel: 'Block',
      typeName: 'RatingSlider',
      fieldLabel: 'property',
    })
  );
}

test('marks with string and { style, label } labels pass the schema', () => {
  expect(
    check({
      min: 1,
      max: 5,
      marks: {
        0: 'N/A',
        1: { style: { fontSize: 10 }, label: '1' },
        5: '5',
      },
    })
  ).toEqual([]);
});

test('marks that are not an object still warn', () => {
  expect(check({ marks: '0,5,10' })).toEqual([
    expect.stringMatching(/^Block "RatingSlider" property "marks" must be type "object"/),
  ]);
});
