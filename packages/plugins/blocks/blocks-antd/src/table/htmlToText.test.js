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

import htmlToText from './htmlToText.js';

test('htmlToText drops tags and decodes escaped characters', () => {
  expect(htmlToText('<b>A &amp; B</b><br/>&lt;c&gt; &quot;d&quot; &#39;e&#39;')).toBe(
    'A & B <c> "d" \'e\''
  );
  expect(htmlToText('  one\n  two ')).toBe('one two');
  expect(htmlToText(null)).toBe('');
  expect(htmlToText(12)).toBe('12');
});
