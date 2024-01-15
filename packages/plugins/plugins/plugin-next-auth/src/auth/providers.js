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

// This syntax does not work because next-auth is not an es module.
// export { default as Auth0Provider } from 'next-auth/providers/auth0';

import forty_two_school from 'next-auth/providers/42-school';
import apple from 'next-auth/providers/apple';
import atlassian from 'next-auth/providers/atlassian';
import auth0 from 'next-auth/providers/auth0';
import authentik from 'next-auth/providers/authentik';
import azure_ad_b2c from 'next-auth/providers/azure-ad-b2c';
import azure_ad from 'next-auth/providers/azure-ad';
import battlenet from 'next-auth/providers/battlenet';
import box from 'next-auth/providers/box';
import boxyhq_saml from 'next-auth/providers/boxyhq-saml';
import bungie from 'next-auth/providers/bungie';
import cognito from 'next-auth/providers/cognito';
import coinbase from 'next-auth/providers/coinbase';
import discord from 'next-auth/providers/discord';
import dropbox from 'next-auth/providers/dropbox';
import eveonline from 'next-auth/providers/eveonline';
import facebook from 'next-auth/providers/facebook';
import faceit from 'next-auth/providers/faceit';
import foursquare from 'next-auth/providers/foursquare';
import freshbooks from 'next-auth/providers/freshbooks';
import fusionauth from 'next-auth/providers/fusionauth';
import github from 'next-auth/providers/github';
import gitlab from 'next-auth/providers/gitlab';
import google from 'next-auth/providers/google';
import hubspot from 'next-auth/providers/hubspot';
import instagram from 'next-auth/providers/instagram';
import kakao from 'next-auth/providers/kakao';
import keycloak from 'next-auth/providers/keycloak';
import line from 'next-auth/providers/line';
import linkedin from 'next-auth/providers/linkedin';
import mailchimp from 'next-auth/providers/mailchimp';
import mailru from 'next-auth/providers/mailru';
import medium from 'next-auth/providers/medium';
import naver from 'next-auth/providers/naver';
import netlify from 'next-auth/providers/netlify';
import okta from 'next-auth/providers/okta';
import onelogin from 'next-auth/providers/onelogin';
import osso from 'next-auth/providers/osso';
import osu from 'next-auth/providers/osu';
import passage from 'next-auth/providers/passage';
import patreon from 'next-auth/providers/patreon';
import pinterest from 'next-auth/providers/pinterest';
import pipedrive from 'next-auth/providers/pipedrive';
import reddit from 'next-auth/providers/reddit';
import salesforce from 'next-auth/providers/salesforce';
import slack from 'next-auth/providers/slack';
import spotify from 'next-auth/providers/spotify';
import strava from 'next-auth/providers/strava';
import todoist from 'next-auth/providers/todoist';
import trakt from 'next-auth/providers/trakt';
import twitch from 'next-auth/providers/twitch';
import twitter from 'next-auth/providers/twitter';
import vk from 'next-auth/providers/vk';
import united_effects from 'next-auth/providers/united-effects';
import wikimedia from 'next-auth/providers/wikimedia';
import wordpress from 'next-auth/providers/wordpress';
import workos from 'next-auth/providers/workos';
import yandex from 'next-auth/providers/yandex';
import zitadel from 'next-auth/providers/zitadel';
import zoho from 'next-auth/providers/zoho';
import zoom from 'next-auth/providers/zoom';
import OpenIDConnectProvider from './OpenIDConnectProvider.js';

const FortyTwoProvider = forty_two_school.default;
const AppleProvider = apple.default;
const AtlassianProvider = atlassian.default;
const Auth0Provider = auth0.default;
const AuthentikProvider = authentik.default;
const AzureADB2CProvider = azure_ad_b2c.default;
const AzureADProvider = azure_ad.default;
const BattleNetProvider = battlenet.default;
const BoxProvider = box.default;
const BoxyHQSAMLProvider = boxyhq_saml.default;
const BungieProvider = bungie.default;
const CognitoProvider = cognito.default;
const CoinbaseProvider = coinbase.default;
const DiscordProvider = discord.default;
const DropboxProvider = dropbox.default;
const EVEOnlineProvider = eveonline.default;
const FacebookProvider = facebook.default;
const FaceItProvider = faceit.default;
const FourSquareProvider = foursquare.default;
const FreshbooksProvider = freshbooks.default;
const FusionAuthProvider = fusionauth.default;
const GitHubProvider = github.default;
const GitlabProvider = gitlab.default;
const GoogleProvider = google.default;
const HubspotProvider = hubspot.default;
const InstagramProvider = instagram.default;
const KakaoProvider = kakao.default;
const KeycloakProvider = keycloak.default;
const LineProvider = line.default;
const LinkedInProvider = linkedin.default;
const MailchimpProvider = mailchimp.default;
const MailRuProvider = mailru.default;
const MediumProvider = medium.default;
const NaverProvider = naver.default;
const NetlifyProvider = netlify.default;
const OktaProvider = okta.default;
const OneLoginProvider = onelogin.default;
const OssoProvider = osso.default;
const OsuProvider = osu.default;
const PassageProvider = passage.default;
const PatreonProvider = patreon.default;
const PinterestProvider = pinterest.default;
const PipedriveProvider = pipedrive.default;
const RedditProvider = reddit.default;
const SalesforceProvider = salesforce.default;
const SlackProvider = slack.default;
const SpotifyProvider = spotify.default;
const StravaProvider = strava.default;
const TodoistProvider = todoist.default;
const TraktProvider = trakt.default;
const TwitchProvider = twitch.default;
const TwitterProvider = twitter.default;
const UnitedEffects = united_effects.default;
const VkProvider = vk.default;
const WikimediaProvider = wikimedia.default;
const WordpressProvider = wordpress.default;
const WorkOSProvider = workos.default;
const YandexProvider = yandex.default;
const ZitadelProvider = zitadel.default;
const ZohoProvider = zoho.default;
const ZoomProvider = zoom.default;

export {
  FortyTwoProvider,
  AppleProvider,
  AtlassianProvider,
  Auth0Provider,
  AuthentikProvider,
  AzureADB2CProvider,
  AzureADProvider,
  BattleNetProvider,
  BoxProvider,
  BoxyHQSAMLProvider,
  BungieProvider,
  CognitoProvider,
  CoinbaseProvider,
  DiscordProvider,
  DropboxProvider,
  EVEOnlineProvider,
  FacebookProvider,
  FaceItProvider,
  FourSquareProvider,
  FreshbooksProvider,
  FusionAuthProvider,
  GitHubProvider,
  GitlabProvider,
  GoogleProvider,
  HubspotProvider,
  InstagramProvider,
  KakaoProvider,
  KeycloakProvider,
  LineProvider,
  LinkedInProvider,
  MailchimpProvider,
  MailRuProvider,
  MediumProvider,
  NaverProvider,
  NetlifyProvider,
  OktaProvider,
  OneLoginProvider,
  OpenIDConnectProvider,
  OssoProvider,
  OsuProvider,
  PassageProvider,
  PatreonProvider,
  PinterestProvider,
  PipedriveProvider,
  RedditProvider,
  SalesforceProvider,
  SlackProvider,
  SpotifyProvider,
  StravaProvider,
  TodoistProvider,
  TraktProvider,
  TwitchProvider,
  TwitterProvider,
  UnitedEffects,
  VkProvider,
  WikimediaProvider,
  WordpressProvider,
  WorkOSProvider,
  YandexProvider,
  ZitadelProvider,
  ZohoProvider,
  ZoomProvider,
};
