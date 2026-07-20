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

async function getConsecutiveIdIndex({ collection, prefix, session }) {
  const previous = await collection
    .aggregate(
      [
        { $match: { _id: { $regex: `^${prefix}\\d+$` } } },
        {
          $project: {
            index: { $toInt: { $replaceOne: { input: '$_id', find: prefix, replacement: '' } } },
          },
        },
        {
          $sort: {
            index: -1,
          },
        },
        { $limit: 1 },
      ],
      { session }
    )
    .toArray();
  return (previous?.[0]?.index ?? 0) + 1;
}

export default getConsecutiveIdIndex;
