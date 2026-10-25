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

// Trades a sign-in token from an app email (CreateSignInToken) for a session in
// the token's organization, then lands on the landing the token was minted
// with. The token is single-use. Bind it to a real click
// or tap on the landing page the email links to: the exchange is a POST, so a
// mail scanner that fetches the link spends and learns nothing. A refused token
// throws - catch it (:catch / onError) and fall back to an ordinary sign-in.
function SignInWithToken({ methods: { signInWithToken }, params }) {
  return signInWithToken(params);
}

export default SignInWithToken;
