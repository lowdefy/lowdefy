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

import { jest } from '@jest/globals';
import path from 'path';

/**
 * Extended types map for success tests - includes more types for comprehensive coverage.
 */
const snapshotTypesMap = {
  actions: {
    CallMethod: { package: '@lowdefy/actions-core' },
    CopyToClipboard: { package: '@lowdefy/actions-core' },
    DisplayMessage: { package: '@lowdefy/actions-core' },
    Link: { package: '@lowdefy/actions-core' },
    Login: { package: '@lowdefy/actions-core' },
    Logout: { package: '@lowdefy/actions-core' },
    Request: { package: '@lowdefy/actions-core' },
    Reset: { package: '@lowdefy/actions-core' },
    ResetValidation: { package: '@lowdefy/actions-core' },
    ScrollTo: { package: '@lowdefy/actions-core' },
    SetFocus: { package: '@lowdefy/actions-core' },
    SetGlobal: { package: '@lowdefy/actions-core' },
    SetState: { package: '@lowdefy/actions-core' },
    Throw: { package: '@lowdefy/actions-core' },
    Validate: { package: '@lowdefy/actions-core' },
    Wait: { package: '@lowdefy/actions-core' },
    Return: { package: '@lowdefy/api' },
    Log: { package: '@lowdefy/actions-core' },
  },
  blocks: {
    // Basic blocks
    Anchor: { package: '@lowdefy/blocks-basic' },
    Box: { package: '@lowdefy/blocks-basic' },
    Button: { package: '@lowdefy/blocks-basic' },
    DangerousHtml: { package: '@lowdefy/blocks-basic' },
    Html: { package: '@lowdefy/blocks-basic' },
    Icon: { package: '@lowdefy/blocks-basic' },
    Img: { package: '@lowdefy/blocks-basic' },
    List: { package: '@lowdefy/blocks-basic' },
    Paragraph: { package: '@lowdefy/blocks-basic' },
    Span: { package: '@lowdefy/blocks-basic' },
    Throw: { package: '@lowdefy/blocks-basic' },
    Title: { package: '@lowdefy/blocks-basic' },
    // Loaders
    ProgressBar: { package: '@lowdefy/blocks-loaders' },
    Skeleton: { package: '@lowdefy/blocks-loaders' },
    SkeletonAvatar: { package: '@lowdefy/blocks-loaders' },
    SkeletonButton: { package: '@lowdefy/blocks-loaders' },
    SkeletonInput: { package: '@lowdefy/blocks-loaders' },
    SkeletonParagraph: { package: '@lowdefy/blocks-loaders' },
    Spinner: { package: '@lowdefy/blocks-loaders' },
    // Antd blocks
    Alert: { package: '@lowdefy/blocks-antd' },
    AutoComplete: { package: '@lowdefy/blocks-antd' },
    Avatar: { package: '@lowdefy/blocks-antd' },
    Badge: { package: '@lowdefy/blocks-antd' },
    Breadcrumb: { package: '@lowdefy/blocks-antd' },
    Card: { package: '@lowdefy/blocks-antd' },
    Carousel: { package: '@lowdefy/blocks-antd' },
    CheckboxSelector: { package: '@lowdefy/blocks-antd' },
    Collapse: { package: '@lowdefy/blocks-antd' },
    Comment: { package: '@lowdefy/blocks-antd' },
    ConfirmModal: { package: '@lowdefy/blocks-antd' },
    Content: { package: '@lowdefy/blocks-antd' },
    DateSelector: { package: '@lowdefy/blocks-antd' },
    Descriptions: { package: '@lowdefy/blocks-antd' },
    Divider: { package: '@lowdefy/blocks-antd' },
    Drawer: { package: '@lowdefy/blocks-antd' },
    Footer: { package: '@lowdefy/blocks-antd' },
    Header: { package: '@lowdefy/blocks-antd' },
    Label: { package: '@lowdefy/blocks-antd' },
    Layout: { package: '@lowdefy/blocks-antd' },
    Menu: { package: '@lowdefy/blocks-antd' },
    Message: { package: '@lowdefy/blocks-antd' },
    MobileMenu: { package: '@lowdefy/blocks-antd' },
    Modal: { package: '@lowdefy/blocks-antd' },
    MultipleSelector: { package: '@lowdefy/blocks-antd' },
    NumberInput: { package: '@lowdefy/blocks-antd' },
    PageHeaderMenu: { package: '@lowdefy/blocks-antd' },
    PageSiderMenu: { package: '@lowdefy/blocks-antd' },
    Pagination: { package: '@lowdefy/blocks-antd' },
    ParagraphInput: { package: '@lowdefy/blocks-antd' },
    PasswordInput: { package: '@lowdefy/blocks-antd' },
    Popover: { package: '@lowdefy/blocks-antd' },
    Progress: { package: '@lowdefy/blocks-antd' },
    RadioSelector: { package: '@lowdefy/blocks-antd' },
    RatingSlider: { package: '@lowdefy/blocks-antd' },
    Result: { package: '@lowdefy/blocks-antd' },
    Selector: { package: '@lowdefy/blocks-antd' },
    Sider: { package: '@lowdefy/blocks-antd' },
    Statistic: { package: '@lowdefy/blocks-antd' },
    Switch: { package: '@lowdefy/blocks-antd' },
    Tabs: { package: '@lowdefy/blocks-antd' },
    Tag: { package: '@lowdefy/blocks-antd' },
    TextArea: { package: '@lowdefy/blocks-antd' },
    TextInput: { package: '@lowdefy/blocks-antd' },
    TitleInput: { package: '@lowdefy/blocks-antd' },
    Tooltip: { package: '@lowdefy/blocks-antd' },
    TreeSelector: { package: '@lowdefy/blocks-antd' },
  },
  connections: {
    AxiosHttp: { package: '@lowdefy/connection-axios-http' },
    MongoDBCollection: { package: '@lowdefy/connection-mongodb' },
    Knex: { package: '@lowdefy/connection-knex' },
    Redis: { package: '@lowdefy/connection-redis' },
    SendGridMail: { package: '@lowdefy/connection-sendgrid' },
    Stripe: { package: '@lowdefy/connection-stripe' },
    GoogleSheet: { package: '@lowdefy/connection-google-sheets' },
    Elasticsearch: { package: '@lowdefy/connection-elasticsearch' },
    AWSS3: { package: '@lowdefy/plugin-aws' },
  },
  requests: {
    AxiosHttp: { package: '@lowdefy/connection-axios-http' },
    MongoDBFind: { package: '@lowdefy/connection-mongodb' },
    MongoDBFindOne: { package: '@lowdefy/connection-mongodb' },
    MongoDBInsertOne: { package: '@lowdefy/connection-mongodb' },
    MongoDBInsertMany: { package: '@lowdefy/connection-mongodb' },
    MongoDBUpdateOne: { package: '@lowdefy/connection-mongodb' },
    MongoDBUpdateMany: { package: '@lowdefy/connection-mongodb' },
    MongoDBDeleteOne: { package: '@lowdefy/connection-mongodb' },
    MongoDBDeleteMany: { package: '@lowdefy/connection-mongodb' },
    MongoDBAggregate: { package: '@lowdefy/connection-mongodb' },
    KnexRaw: { package: '@lowdefy/connection-knex' },
    RedisGet: { package: '@lowdefy/connection-redis' },
    RedisSet: { package: '@lowdefy/connection-redis' },
    SendGridMailSend: { package: '@lowdefy/connection-sendgrid' },
    StripePaymentIntents: { package: '@lowdefy/connection-stripe' },
    GoogleSheetGetMany: { package: '@lowdefy/connection-google-sheets' },
    GoogleSheetAppendOne: { package: '@lowdefy/connection-google-sheets' },
    ElasticsearchSearch: { package: '@lowdefy/connection-elasticsearch' },
    AWSS3GetObject: { package: '@lowdefy/plugin-aws' },
    AWSS3PutObject: { package: '@lowdefy/plugin-aws' },
  },
  auth: {
    adapters: {
      MongoDBAdapter: { package: '@lowdefy/plugin-next-auth' },
    },
    callbacks: {
      JwtCallback: { package: '@lowdefy/plugin-next-auth' },
      SessionCallback: { package: '@lowdefy/plugin-next-auth' },
      SignInCallback: { package: '@lowdefy/plugin-next-auth' },
      RedirectCallback: { package: '@lowdefy/plugin-next-auth' },
    },
    events: {
      SignIn: { package: '@lowdefy/plugin-next-auth' },
      SignOut: { package: '@lowdefy/plugin-next-auth' },
      CreateUser: { package: '@lowdefy/plugin-next-auth' },
      UpdateUser: { package: '@lowdefy/plugin-next-auth' },
      LinkAccount: { package: '@lowdefy/plugin-next-auth' },
      Session: { package: '@lowdefy/plugin-next-auth' },
    },
    providers: {
      Auth0Provider: { package: '@lowdefy/plugin-auth0' },
      GoogleProvider: { package: 'next-auth' },
      GitHubProvider: { package: 'next-auth' },
      CredentialsProvider: { package: 'next-auth' },
      EmailProvider: { package: 'next-auth' },
    },
  },
  operators: {
    client: {
      _state: { package: '@lowdefy/operators-js' },
      _input: { package: '@lowdefy/operators-js' },
      _global: { package: '@lowdefy/operators-js' },
      _request: { package: '@lowdefy/operators-js' },
      _user: { package: '@lowdefy/operators-js' },
      _event: { package: '@lowdefy/operators-js' },
      _actions: { package: '@lowdefy/operators-js' },
      _location: { package: '@lowdefy/operators-js' },
      _media: { package: '@lowdefy/operators-js' },
      _menu: { package: '@lowdefy/operators-js' },
      _if: { package: '@lowdefy/operators-js' },
      _eq: { package: '@lowdefy/operators-js' },
      _ne: { package: '@lowdefy/operators-js' },
      _lt: { package: '@lowdefy/operators-js' },
      _lte: { package: '@lowdefy/operators-js' },
      _gt: { package: '@lowdefy/operators-js' },
      _gte: { package: '@lowdefy/operators-js' },
      _and: { package: '@lowdefy/operators-js' },
      _or: { package: '@lowdefy/operators-js' },
      _not: { package: '@lowdefy/operators-js' },
      _type: { package: '@lowdefy/operators-js' },
      _get: { package: '@lowdefy/operators-js' },
      _array: { package: '@lowdefy/operators-js' },
      _object: { package: '@lowdefy/operators-js' },
      _string: { package: '@lowdefy/operators-js' },
      _sum: { package: '@lowdefy/operators-js' },
      _subtract: { package: '@lowdefy/operators-js' },
      _product: { package: '@lowdefy/operators-js' },
      _divide: { package: '@lowdefy/operators-js' },
      _json: { package: '@lowdefy/operators-js' },
      _yaml: { package: '@lowdefy/operators-js' },
      _date: { package: '@lowdefy/operators-js' },
      _payload: { package: '@lowdefy/operators-js' },
      _args: { package: '@lowdefy/operators-js' },
      _function: { package: '@lowdefy/operators-js' },
      _random: { package: '@lowdefy/operators-js' },
      _uuid: { package: '@lowdefy/operators-uuid' },
      _moment: { package: '@lowdefy/operators-moment' },
      _regex: { package: '@lowdefy/operators-js' },
      _hash: { package: '@lowdefy/operators-js' },
      _base64: { package: '@lowdefy/operators-js' },
      _uri: { package: '@lowdefy/operators-js' },
      _url_query: { package: '@lowdefy/operators-js' },
      _switch: { package: '@lowdefy/operators-js' },
      _if_none: { package: '@lowdefy/operators-js' },
      _intl: { package: '@lowdefy/operators-js' },
      _change_case: { package: '@lowdefy/operators-change-case' },
      _diff: { package: '@lowdefy/operators-diff' },
      _mql: { package: '@lowdefy/operators-mql' },
      _nunjucks: { package: '@lowdefy/operators-nunjucks' },
      _js: { package: '@lowdefy/operators-js' },
    },
    server: {
      _payload: { package: '@lowdefy/operators-js' },
      _step: { package: '@lowdefy/operators-js' },
      _secret: { package: '@lowdefy/operators-js' },
      _request: { package: '@lowdefy/operators-js' },
      _user: { package: '@lowdefy/operators-js' },
      _if: { package: '@lowdefy/operators-js' },
      _eq: { package: '@lowdefy/operators-js' },
      _get: { package: '@lowdefy/operators-js' },
      _array: { package: '@lowdefy/operators-js' },
      _object: { package: '@lowdefy/operators-js' },
      _string: { package: '@lowdefy/operators-js' },
      _json: { package: '@lowdefy/operators-js' },
      _yaml: { package: '@lowdefy/operators-js' },
      _date: { package: '@lowdefy/operators-js' },
      _mql: { package: '@lowdefy/operators-mql' },
      _js: { package: '@lowdefy/operators-js' },
    },
  },
  controls: {
    Endpoint: { package: '@lowdefy/api' },
    Log: { package: '@lowdefy/api' },
    Return: { package: '@lowdefy/api' },
    Throw: { package: '@lowdefy/api' },
    SetState: { package: '@lowdefy/api' },
  },
};

/**
 * Creates a runBuild helper function for snapshot testing build artifacts.
 *
 * @param {Function} build - The build function
 * @param {string} fixturesDir - Absolute path to the fixtures directory
 * @param {Function} mockWriteBuildArtifact - Mock function to capture artifacts
 * @returns {Function} runBuild helper function
 */
function createRunBuildForSnapshots(build, fixturesDir, mockWriteBuildArtifact) {
  return async function runBuild(fixtureDir, stage = 'prod') {
    const configDir = path.join(fixturesDir, fixtureDir);
    const artifacts = {};

    // Create a mock that captures written artifacts
    mockWriteBuildArtifact.mockImplementation((filePath, content) => {
      artifacts[filePath] = content;
    });

    const logger = {
      info: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      succeed: jest.fn(),
    };

    await build({
      customTypesMap: snapshotTypesMap,
      directories: {
        config: configDir,
        build: path.join(configDir, '.lowdefy'),
        server: path.join(configDir, '.lowdefy', 'server'),
      },
      logger,
      stage,
    });

    // Parse JSON artifacts for snapshot comparison
    const parsedArtifacts = {};
    for (const [filePath, content] of Object.entries(artifacts)) {
      if (filePath.endsWith('.json')) {
        try {
          parsedArtifacts[filePath] = JSON.parse(content);
        } catch {
          parsedArtifacts[filePath] = content;
        }
      } else {
        parsedArtifacts[filePath] = content;
      }
    }

    return {
      artifacts: parsedArtifacts,
      logger,
    };
  };
}

export { snapshotTypesMap, createRunBuildForSnapshots };
