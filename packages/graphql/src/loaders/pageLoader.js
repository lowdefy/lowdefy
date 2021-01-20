/*
  Copyright 2020-2021 Lowdefy, Inc

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

import path from 'path';
import Dataloader from 'dataloader';
import readJsonFile from './readJsonFile';

function createPageBatchLoader({ CONFIGURATION_BASE_PATH }) {
  async function readPage(id) {
    const filePath = path.resolve(CONFIGURATION_BASE_PATH, `pages/${id}/${id}.json`);
    return readJsonFile({ filePath });
  }
  async function pageLoader(keys) {
    return keys.map((id) => readPage(id));
  }
  return pageLoader;
}

function createPageLoader({ CONFIGURATION_BASE_PATH }) {
  return new Dataloader(createPageBatchLoader({ CONFIGURATION_BASE_PATH }));
}

export default createPageLoader;
