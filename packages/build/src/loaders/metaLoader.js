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

import { get } from '@lowdefy/helpers';
import Dataloader from 'dataloader';
import createGetMeta from '../utils/meta/getMeta';

function createMetaBatchLoader({ components, context }) {
  const { cacheDirectory } = context;
  const { types } = components;
  const getMeta = createGetMeta({ cacheDirectory, types });
  async function loader(keys) {
    const fetched = [];
    const promises = keys.map(async (key) => {
      const item = await getMeta(key);
      fetched.push(item);
    });
    await Promise.all(promises);
    const returned = keys
      .map((key) =>
        fetched.find((item) => {
          return get(item, 'type') === key;
        })
      )
      .map((obj) => obj.meta);
    return returned;
  }
  return loader;
}

function createMetaLoader(options) {
  return new Dataloader(createMetaBatchLoader(options));
}

export default createMetaLoader;
