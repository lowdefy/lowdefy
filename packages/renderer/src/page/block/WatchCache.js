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

import React from 'react';
import { get } from '@lowdefy/helpers';
import { useQuery, gql } from '@apollo/client';
import { Loading } from '@lowdefy/block-tools';

const getBlock = gql`
  query getBlock($id: String!) {
    block(id: $id) @client {
      id
      t
    }
  }
`;

const WatchCache = ({ block, render, rootContext }) => {
  const { loading, error } = useQuery(getBlock, {
    variables: {
      id: `BlockClass:${block.id}`,
    },
    client: rootContext.client,
  });

  if (loading)
    return (
      <Loading
        properties={get(block, 'meta.loading.properties')}
        type={get(block, 'meta.loading.type')}
      />
    );
  if (error) throw error;

  return render();
};

export default WatchCache;
