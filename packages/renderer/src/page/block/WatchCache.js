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

import { useQuery, gql } from '@apollo/client';

const getBlock = gql`
  query getBlock($id: String!) {
    block(id: $id) @client {
      id
      t
    }
  }
`;

const WatchCache = ({ block, render, lowdefy, Loading }) => {
  const { loading, error } = useQuery(getBlock, {
    variables: {
      id: `BlockClass:${block.id}`,
    },
    client: lowdefy.client,
  });

  if (loading) return Loading;
  if (error) throw error;

  return render();
};

export default WatchCache;
