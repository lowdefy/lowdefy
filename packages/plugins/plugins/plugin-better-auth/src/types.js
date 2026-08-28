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

export default {
  auth: {
    providers: [
      'GenericOAuth',
      'Apple',
      'Atlassian',
      'Cognito',
      'Discord',
      'Dropbox',
      'Facebook',
      'Figma',
      'GitHub',
      'GitLab',
      'Google',
      'HuggingFace',
      'Kakao',
      'Kick',
      'Line',
      'Linear',
      'LinkedIn',
      'Microsoft',
      'Naver',
      'Notion',
      'PayPal',
      'Paybin',
      'Polar',
      'Railway',
      'Reddit',
      'Roblox',
      'Salesforce',
      'Slack',
      'Spotify',
      'TikTok',
      'Twitch',
      'Twitter',
      'VK',
      'Vercel',
      'WeChat',
      'Zoom',
    ],
    strategies: ['apiKey', 'jwt'],
  },
  steps: [
    'BanUser',
    'CancelInvitation',
    'CreateOrganization',
    'DeleteUser',
    'InviteMember',
    'ListMembers',
    'ListUsers',
    'RemoveMember',
    'ResetUserTwoFactor',
    'RevokeUserPasskeys',
    'RevokeUserSessions',
    'UnbanUser',
    'UpdateMemberAttributes',
    'UpdateMemberOrgRole',
    'UpdateMemberRoles',
    'UpdateOrganization',
    'UpdateUserAttributes',
    'UpdateUserProfile',
  ],
};
