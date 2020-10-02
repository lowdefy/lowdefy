import React from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';
import AutoBlock from './AutoBlock';

const GET_PAGE = gql`
  query page {
    page
  }
`;

const Page = () => {
  const { loading, error, data } = useQuery(GET_PAGE);
  if (loading) return <h2>Loading</h2>;
  if (error) {
    console.log(error);
    return <h2>Error</h2>;
  }
  console.log('data', data);
  return <AutoBlock page={data.page} />;
};

export default Page;
