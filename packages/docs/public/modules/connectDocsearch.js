/*
  Copyright 2020-2024 Lowdefy, Inc

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

function connectDocsearch() {
  let time = 100;
  try {
    // eslint-disable-next-line no-undef
    docsearch({
      apiKey: '4e88995ba28e39b8ed2bcfb6639379a1',
      indexName: 'lowdefy',
      inputSelector: '#docsearch_input',
      debug: true,
    });
  } catch (err) {
    setTimeout(connectDocsearch, time);
    time = time * 2;
  }
}

export default connectDocsearch;
