/*
  Copyright 2020 Lowdefy, Inc

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

import { get } from '@lowdefy/helpers';
import path from 'path';
import Dataloader from 'dataloader';
import getFile from '../utils/files/getFile';

function createFileBatchLoader({ baseDirectory }) {
  async function loader(keys) {
    const filePaths = keys.map((key) => path.resolve(baseDirectory, key));
    const fetched = [];
    const promises = filePaths.map(async (filePath) => {
      const item = await getFile(filePath);
      fetched.push(item);
    });
    await Promise.all(promises);
    const returned = filePaths
      .map((filePath) =>
        fetched.find((item) => {
          return get(item, 'filePath') === filePath;
        })
      )
      .map((obj) => obj.content);
    return returned;
  }
  return loader;
}

function createFileLoader(options) {
  return new Dataloader(createFileBatchLoader(options));
}

export default createFileLoader;
