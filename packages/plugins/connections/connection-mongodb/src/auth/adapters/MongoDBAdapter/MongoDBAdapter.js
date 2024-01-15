/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { MongoClient } from 'mongodb';
import { MongoDBAdapter as NextAuthMongoDBAdapter } from '@next-auth/mongodb-adapter';

/*
Default collections are:
{
  Users: "users",
  Accounts: "accounts",
  Sessions: "sessions",
  VerificationTokens: "verification_tokens",
}
*/

// TODO: Docs: MongoDB database name should be in databaseUri

function MongoDBAdapter({ properties }) {
  const { databaseUri, mongoDBClientOptions, options } = properties;
  const clientPromise = new MongoClient(databaseUri, mongoDBClientOptions).connect();
  return NextAuthMongoDBAdapter(clientPromise, options);
}

export default MongoDBAdapter;
