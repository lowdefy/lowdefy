/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

function createLicenseRedirectCallback(context, license) {
  async function licenseRedirectCallback({ url, baseUrl }) {
    if (license.code !== 'VALID') {
      const code = ['NO_LICENSE', 'EXPIRED'].includes(license.code) ? license.code : 'INVALID';
      return `/lowdefy/license-invalid?code=${code}`;
    }
    if (!license.entitlements.includes('AUTH')) {
      return '/lowdefy/license-invalid?code=NOT_ENTITLED_AUTH';
    }
    return context.authOptions.originalRedirectCallback({ url, baseUrl });
  }
  return licenseRedirectCallback;
}

export default createLicenseRedirectCallback;
