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

import { ConfigError } from '@lowdefy/errors';
import { InvitationEmail } from '@lowdefy/email-templates';

import renderAuthEmail from './renderAuthEmail.js';

const logger = { debug() {}, error() {}, warn() {} };

function createContext({ appEmail, notifications, notificationConfigs, basePath = '' } = {}) {
  return {
    logger,
    config: { basePath },
    notifications: notifications ?? {},
    async readConfigFile(filename) {
      if (filename === 'app.json') {
        return { email: appEmail ?? {} };
      }
      const match = filename.match(/^notifications\/(.+)\.json$/);
      if (match) {
        return (notificationConfigs ?? {})[match[1]];
      }
      return undefined;
    },
  };
}

describe('stock render per flow', () => {
  const cases = [
    { flow: 'verifyEmail', subject: 'Verify your email address' },
    { flow: 'resetPassword', subject: 'Reset your password' },
    { flow: 'magicLink', subject: 'Your sign-in link' },
  ];

  test.each(cases)('renders the stock $flow template', async ({ flow, subject }) => {
    const vars = { url: 'https://app.example.com/link/token-123' };
    const result = await renderAuthEmail({
      flow,
      vars,
      authEmailConfig: undefined,
      baseURL: undefined,
      context: createContext(),
    });
    expect(result.subject).toBe(subject);
    expect(result.html).toContain(vars.url);
    expect(result.html.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });

  test('renders the stock invitation template with an interpolated subject', async () => {
    const vars = {
      url: 'https://app.example.com/invite/token-abc',
      organizationName: 'Acme',
    };
    const result = await renderAuthEmail({
      flow: 'invitation',
      vars,
      authEmailConfig: undefined,
      baseURL: undefined,
      context: createContext(),
    });
    expect(result.subject).toBe("You've been invited to Acme");
    expect(result.html).toContain(vars.url);
    expect(result.html).toContain('Acme');
    expect(result.text.length).toBeGreaterThan(0);
  });

  test('throws ConfigError for an unknown flow', async () => {
    await expect(
      renderAuthEmail({
        flow: 'notAFlow',
        vars: { url: 'https://app.example.com/x' },
        authEmailConfig: undefined,
        baseURL: undefined,
        context: createContext(),
      })
    ).rejects.toThrow(ConfigError);
  });
});

describe('subject resolution', () => {
  test('resolves a string subject static (verifyEmail)', async () => {
    const result = await renderAuthEmail({
      flow: 'verifyEmail',
      vars: { url: 'https://app.example.com/x' },
      authEmailConfig: undefined,
      baseURL: undefined,
      context: createContext(),
    });
    expect(result.subject).toBe('Verify your email address');
  });

  test('resolves a function subject static (invitation)', async () => {
    const result = await renderAuthEmail({
      flow: 'invitation',
      vars: { url: 'https://app.example.com/x', organizationName: 'Globex' },
      authEmailConfig: undefined,
      baseURL: undefined,
      context: createContext(),
    });
    expect(result.subject).toBe("You've been invited to Globex");
  });
});

describe('override render', () => {
  // InvitationEmail stands in as an app-configured override template: it is
  // registered under a custom type in context.notifications and its properties
  // come from the notification config, interpolated against vars.
  test('renders the override template with an interpolated subject and vars in the copy', async () => {
    const vars = {
      url: 'https://app.example.com/verify/tok',
      userName: 'Sam',
      organizationName: 'Acme',
    };
    const context = createContext({
      notifications: { myType: InvitationEmail },
      notificationConfigs: {
        customVerify: {
          '~k': 'notif-key',
          type: 'myType',
          theme: { companyName: 'Override Co' },
          properties: {
            subject: 'Hi {{ userName }}',
            url: '{{ url }}',
            organizationName: '{{ organizationName }}',
          },
        },
      },
    });
    const result = await renderAuthEmail({
      flow: 'verifyEmail',
      vars,
      authEmailConfig: { templates: { verifyEmail: 'customVerify' } },
      baseURL: undefined,
      context,
    });
    expect(result.subject).toBe('Hi Sam');
    // Proves the override template rendered (its invitation button label) and
    // that vars interpolated into the rendered copy.
    expect(result.html).toContain('Accept invitation');
    expect(result.html).toContain('Acme');
    expect(result.html).toContain(vars.url);
  });

  test('throws ConfigError when the override type is absent from context.notifications', async () => {
    const context = createContext({
      notifications: {},
      notificationConfigs: {
        customVerify: { '~k': 'notif-key', type: 'missingType', properties: {} },
      },
    });
    await expect(
      renderAuthEmail({
        flow: 'verifyEmail',
        vars: { url: 'https://app.example.com/x' },
        authEmailConfig: { templates: { verifyEmail: 'customVerify' } },
        baseURL: undefined,
        context,
      })
    ).rejects.toThrow(ConfigError);
  });
});

describe('logo resolution', () => {
  test('resolves a relative logo against baseURL and basePath', async () => {
    const result = await renderAuthEmail({
      flow: 'verifyEmail',
      vars: { url: 'https://app.example.com/x' },
      authEmailConfig: undefined,
      baseURL: 'https://app.example.com',
      context: createContext({ appEmail: { logo: '/logo.png' }, basePath: '/base' }),
    });
    expect(result.html).toContain('https://app.example.com/base/logo.png');
  });

  test('drops a relative logo when no baseURL is pinned', async () => {
    const result = await renderAuthEmail({
      flow: 'verifyEmail',
      vars: { url: 'https://app.example.com/x' },
      authEmailConfig: undefined,
      baseURL: undefined,
      context: createContext({ appEmail: { logo: '/logo.png', companyName: 'MyApp' } }),
    });
    expect(result.html).not.toContain('logo.png');
    expect(result.html).toContain('MyApp');
  });
});
