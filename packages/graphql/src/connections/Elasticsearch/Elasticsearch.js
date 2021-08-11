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

import ElasticsearchDelete from './ElasticsearchDelete/ElasticsearchDelete';
import ElasticsearchDeleteByQuery from './ElasticsearchDeleteByQuery/ElasticsearchDeleteByQuery';
import ElasticsearchIndex from './ElasticsearchIndex/ElasticsearchIndex';
import schema from './ElasticsearchSchema.json';
import ElasticsearchSearch from './ElasticsearchSearch/ElasticsearchSearch';
import ElasticsearchUpdate from './ElasticsearchUpdate/ElasticsearchUpdate';

export default {
  schema,
  requests: {
    ElasticsearchDelete,
    ElasticsearchDeleteByQuery,
    ElasticsearchIndex,
    ElasticsearchSearch,
    ElasticsearchUpdate,
  },
};
