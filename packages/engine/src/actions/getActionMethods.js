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

import createAcceptInvitation from './createAcceptInvitation.js';
import createCallMethod from './createCallMethod.js';
import createCallAPI from './createCallAPI.js';
import createChangePassword from './createChangePassword.js';
import createGetActions from './createGetActions.js';
import createGetBlockId from './createGetBlockId.js';
import createGetEvent from './createGetEvent.js';
import createGetGlobal from './createGetGlobal.js';
import createGetInput from './createGetInput.js';
import createGetLocale from './createGetLocale.js';
import createGetPageId from './createGetPageId.js';
import createGetRequestDetails from './createGetRequestDetails.js';
import createGetState from './createGetState.js';
import createGetUrlQuery from './createGetUrlQuery.js';
import createGetUser from './createGetUser.js';
import createImpersonateUser from './createImpersonateUser.js';
import createLink from './createLink.js';
import createLogin from './createLogin.js';
import createLogout from './createLogout.js';
import createDisplayMessage from './createDisplayMessage.js';
import createPasskeyDelete from './createPasskeyDelete.js';
import createPasskeyRegister from './createPasskeyRegister.js';
import createPhoneNumberSendOtp from './createPhoneNumberSendOtp.js';
import createPhoneNumberVerify from './createPhoneNumberVerify.js';
import createPublish from './createPublish.js';
import createRequest from './createRequest.js';
import createRequestPasswordReset from './createRequestPasswordReset.js';
import createReset from './createReset.js';
import createResetPassword from './createResetPassword.js';
import createResetValidation from './createResetValidation.js';
import createRevokeOtherSessions from './createRevokeOtherSessions.js';
import createSendVerificationEmail from './createSendVerificationEmail.js';
import createSetActiveOrganization from './createSetActiveOrganization.js';
import createSetGlobal from './createSetGlobal.js';
import createSetState from './createSetState.js';
import createSignUp from './createSignUp.js';
import createStopImpersonating from './createStopImpersonating.js';
import createSubscribe from './createSubscribe.js';
import createTranslate from './createTranslate.js';
import createTwoFactorDisable from './createTwoFactorDisable.js';
import createTwoFactorEnable from './createTwoFactorEnable.js';
import createTwoFactorVerify from './createTwoFactorVerify.js';
import createUnsubscribe from './createUnsubscribe.js';
import createUpdateSession from './createUpdateSession.js';
import createValidate from './createValidate.js';

function getActionMethods(props) {
  return {
    acceptInvitation: createAcceptInvitation(props),
    callAPI: createCallAPI(props),
    callMethod: createCallMethod(props),
    changePassword: createChangePassword(props),
    displayMessage: createDisplayMessage(props),
    getActions: createGetActions(props),
    getBlockId: createGetBlockId(props),
    getEvent: createGetEvent(props),
    getGlobal: createGetGlobal(props),
    getInput: createGetInput(props),
    getLocale: createGetLocale(props),
    getPageId: createGetPageId(props),
    getRequestDetails: createGetRequestDetails(props),
    getState: createGetState(props),
    getUrlQuery: createGetUrlQuery(props),
    getUser: createGetUser(props),
    impersonateUser: createImpersonateUser(props),
    link: createLink(props),
    login: createLogin(props),
    logout: createLogout(props),
    passkeyDelete: createPasskeyDelete(props),
    passkeyRegister: createPasskeyRegister(props),
    phoneNumberSendOtp: createPhoneNumberSendOtp(props),
    phoneNumberVerify: createPhoneNumberVerify(props),
    publish: createPublish(props),
    request: createRequest(props),
    requestPasswordReset: createRequestPasswordReset(props),
    reset: createReset(props),
    resetPassword: createResetPassword(props),
    resetValidation: createResetValidation(props),
    revokeOtherSessions: createRevokeOtherSessions(props),
    sendVerificationEmail: createSendVerificationEmail(props),
    setActiveOrganization: createSetActiveOrganization(props),
    setGlobal: createSetGlobal(props),
    setState: createSetState(props),
    signUp: createSignUp(props),
    stopImpersonating: createStopImpersonating(props),
    subscribe: createSubscribe(props),
    translate: createTranslate(props),
    twoFactorDisable: createTwoFactorDisable(props),
    twoFactorEnable: createTwoFactorEnable(props),
    twoFactorVerify: createTwoFactorVerify(props),
    unsubscribe: createUnsubscribe(props),
    updateSession: createUpdateSession(props),
    validate: createValidate(props),
  };
}

export default getActionMethods;
