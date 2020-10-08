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

import gql from 'graphql-tag';

const GET_CLI_TOKEN = gql`
  query getCliToken {
    cliToken
  }
`;

class AppGraphql {
  constructor({ branch, client }) {
    this.branch = branch;
    this.client = client;
  }

  callMutation(mutation, variables) {
    return this.client.mutate({
      mutation,
      variables,
    });
  }

  callQuery(query, variables) {
    return this.client.query({
      query,
      variables,
    });
  }

  async getCliToken() {
    try {
      const res = await this.callQuery(GET_CLI_TOKEN, {});
      return res.data.cliToken;
    } catch (error) {
      return null;
    }
  }
}

export default AppGraphql;
