import { gql } from '@apollo/client';

const SET_BLOCK_UPDATE_CACHE = gql`
  fragment BlockClassFragment on BlockClass @client {
    id
    t
  }
`;

const createUpdateBlock = (client) => {
  const updateBlock = (blockId) => {
    client.writeFragment({
      id: `BlockClass:${blockId}`,
      fragment: SET_BLOCK_UPDATE_CACHE,
      data: {
        id: blockId,
        t: Date.now(),
        __typename: 'BlockClass',
      },
    });
  };

  return updateBlock;
};

export default createUpdateBlock;
