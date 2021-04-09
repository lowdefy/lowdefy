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

import AwsS3Bucket from './AwsS3Bucket/AwsS3Bucket';
import AxiosHttp from './AxiosHttp/AxiosHttp';
import GoogleSheet from './GoogleSheet/GoogleSheet';
import Knex from './Knex/Knex';
import MongoDBCollection from './MongoDBCollection/MongoDBCollection';
import SendGridMail from './SendGridMail/SendGridMail';

const resolvers = {
  AwsS3Bucket,
  AxiosHttp,
  GoogleSheet,
  Knex,
  MongoDBCollection,
  SendGridMail,
};

export default resolvers;
