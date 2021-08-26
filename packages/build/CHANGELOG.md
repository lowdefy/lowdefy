# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/build





# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)


### Bug Fixes

* **build:** Add debounce to the build schema. ([2ea31b1](https://github.com/lowdefy/lowdefy/commit/2ea31b1f3e770a1edbcdefa790908f9df7c04997))





## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)


### Bug Fixes

* **build:** Fix user specified type locations. ([0456b00](https://github.com/lowdefy/lowdefy/commit/0456b0073dc13d743ba962d81488088c3794d3da))





## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)


### Bug Fixes

* **build:** Cache readFile and getMeta promises. ([d1fd3da](https://github.com/lowdefy/lowdefy/commit/d1fd3daa90716e98e3a06022e743df9a3fdd58d0))





## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)


### Bug Fixes

* **build:** Cache readFile and getMeta promises. ([d1fd3da](https://github.com/lowdefy/lowdefy/commit/d1fd3daa90716e98e3a06022e743df9a3fdd58d0))





## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)


### Bug Fixes

* **build:** Fix unevaluated being passed to _ref transformer. ([537a776](https://github.com/lowdefy/lowdefy/commit/537a77651220d7ffab117572c40ff790e296af56))





# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)


### Bug Fixes

* **build:** Add tests for readConfigFile. ([809f09a](https://github.com/lowdefy/lowdefy/commit/809f09a51fb46d94c54a35042cd0fb6c58f11fbd))
* **build:** Add writeBuildArtifact test. ([350f25f](https://github.com/lowdefy/lowdefy/commit/350f25faf8171c3ed42a738b39333d289cb1dee8))
* **build:** Fix getMeta memoisation ([7f824b0](https://github.com/lowdefy/lowdefy/commit/7f824b0553358c695c64ffe0fcbf38ca04a075c3))
* **build:** Fix getMeta memoised return. ([a939bd5](https://github.com/lowdefy/lowdefy/commit/a939bd5b3fd68c557e38848993551dff19b5622e))
* **build:** Fix getMeta return value after dataloader has been removed. ([993d398](https://github.com/lowdefy/lowdefy/commit/993d3988be32e46e93619ed2edc5a6380f726510))
* **build:** Refactor build refs. ([dbb7c88](https://github.com/lowdefy/lowdefy/commit/dbb7c88f44719277b2583c3b11a2cd150be841d1))
* **build:** refactor buildRefs function. ([b66cc5a](https://github.com/lowdefy/lowdefy/commit/b66cc5a38db08666a8edc0312045c2b8ea20f66e))
* **build:** Refactor buildRefs. ([8d43e00](https://github.com/lowdefy/lowdefy/commit/8d43e004e52384c143524645f36544d4795affe9))
* **build:** Refactor reading of config files. ([d1591a2](https://github.com/lowdefy/lowdefy/commit/d1591a2a0578a4bda230e35e86fcbd1d4e5dcffa))
* **build:** Refactor writing of build artifact files. ([7162760](https://github.com/lowdefy/lowdefy/commit/7162760b18b62c9b5f25ea1ff024c1c1724132df))
* **build:** Remove dataloader dependency ([4c64bd7](https://github.com/lowdefy/lowdefy/commit/4c64bd7ce290ba7881d6deda3097d0b9fb765203))
* **build:** remove metaloader to remove dataloader dependency ([f6f35a9](https://github.com/lowdefy/lowdefy/commit/f6f35a91342a771a644a350378ef52ab9d80c05d))
* **build:** Remove unsupported eval property on _ref. ([808f619](https://github.com/lowdefy/lowdefy/commit/808f619d19c6b450133861913ee56e69f783fbc0))
* **build:** Remove unused tests. ([f2db270](https://github.com/lowdefy/lowdefy/commit/f2db270a223e290a58fcd4e2225365692d83e097))
* **build:** Standarise buildPages function signatures. ([65c7e8b](https://github.com/lowdefy/lowdefy/commit/65c7e8ba9b39609c992878d84968a2cbc60b4a16))
* **build:** Test memoisation in getMeta. ([c1f887e](https://github.com/lowdefy/lowdefy/commit/c1f887e4ff3da0122d3d7b5566a1f64f7a6dc0e1))


### Features

* **build:** Add support for app default ref resolver function. ([b23e8c9](https://github.com/lowdefy/lowdefy/commit/b23e8c967ec1c48664a9aef954a0b53497af28d2))
* **build:** Add support for resolver functions in _ref operator. ([aa7fddc](https://github.com/lowdefy/lowdefy/commit/aa7fddcfc20b3689400bd69d9b865f9306e6991f))
* Make blocks server URL configurable. ([65c9fe7](https://github.com/lowdefy/lowdefy/commit/65c9fe79b254bf5a20b87e0a2ec4fdcd1ecd5427)), closes [#670](https://github.com/lowdefy/lowdefy/issues/670)





# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package @lowdefy/build





## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package @lowdefy/build





# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)


### Bug Fixes

* **build:** default 404 page should be copied in build. ([8e0d8ca](https://github.com/lowdefy/lowdefy/commit/8e0d8ca160193728bc14f5dbc43d411a77835ed4)), closes [#647](https://github.com/lowdefy/lowdefy/issues/647)
* **build:** Improve build error messages for missing ids. ([ecd2488](https://github.com/lowdefy/lowdefy/commit/ecd2488ff4a71eee4732cc213eee2308b682410a))
* **build:** Improve error message. ([258d4ad](https://github.com/lowdefy/lowdefy/commit/258d4adc299922b16058c8ba82e937944154d089))
* **build:** Throw an error if request id contains a period. ([933e4fa](https://github.com/lowdefy/lowdefy/commit/933e4fa35a0f5f481c1d426682eca560c51210e6))





## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/build





## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/build





# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/build





# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/build





# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/build





# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/build





# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)


### Bug Fixes

* **build:** Handle try catch options in actions schema. ([7e05b0e](https://github.com/lowdefy/lowdefy/commit/7e05b0eb75a92613507731e1cbceb71433d86e71))


### Features

* **build:** Add a default 404 page if no page is defined. ([b0abb39](https://github.com/lowdefy/lowdefy/commit/b0abb39e108ab22421cb5bac9248dcef9e209367))





## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)


### Bug Fixes

* **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))





## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/build





## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/build





## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/build





## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)


### Bug Fixes

* **build:** Add default locations for new blocks. ([544d1e1](https://github.com/lowdefy/lowdefy/commit/544d1e1d8459fb03294eb692f12116fa9f3904a5))





# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)


### Bug Fixes

* **build:** Do not throw on validate app config. ([96904a7](https://github.com/lowdefy/lowdefy/commit/96904a7783695f2b60b20be9488ffcb8dde79930))
* Rename appendHeader to appendHead. ([4e79736](https://github.com/lowdefy/lowdefy/commit/4e797363540bd0f5cfbe65928585012316b05a58))


### Features

* **build:** Build app config. ([6575bc7](https://github.com/lowdefy/lowdefy/commit/6575bc78bc37a1b33f301364a5daee4bab324884))





# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)


### Features

* Remove logoutFromProvider config, and nunjucks template logout url ([111d3da](https://github.com/lowdefy/lowdefy/commit/111d3da83f4d132e4243583dabbdd7cdaae69fe7)), closes [#563](https://github.com/lowdefy/lowdefy/issues/563)





## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/build





# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)


### Bug Fixes

* **build:** Fix build import. ([307d0ce](https://github.com/lowdefy/lowdefy/commit/307d0ce152bae7a5327f0488e8ac23f0b592cc8b))


### Features

* **build:** Build auth objects for role bases authorization. ([5fa6436](https://github.com/lowdefy/lowdefy/commit/5fa643643dc4ef5a04737228c87acf76c23e3135))
* **build:** Build correct auth object for menus ([2145033](https://github.com/lowdefy/lowdefy/commit/21450334159b216b833bc8e8cd6656269b380746))
* **build:** Update lowdefy app schema to include rolesField. ([3f1e06b](https://github.com/lowdefy/lowdefy/commit/3f1e06b38d9f1590a1ed275b138c358d5e252283))





# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)


### Bug Fixes

* **build:** Add configDirectory to context for full local builds. ([5a6a36d](https://github.com/lowdefy/lowdefy/commit/5a6a36dc3373b9864896171b2f5d3185d72d6c3b))
* **build:** Add eval option to _ref operator during build. ([eb62e8a](https://github.com/lowdefy/lowdefy/commit/eb62e8a22b326c16148ae8324d64d89022cf16c6))
* **build:** Add list of operators in context to build. ([88a6f24](https://github.com/lowdefy/lowdefy/commit/88a6f24c8f486ee5370e78c8829cad0fb2d18492))





## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/build





## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/build





## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/build





## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/build





## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/build





## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/build





# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)


### Features

* **blockECharts:** Add EChart block 🎁. ([deff965](https://github.com/lowdefy/lowdefy/commit/deff96504ff1b24152a82458511b0426cec5d8ee))





## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/build





## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/build





## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/build





## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/build





# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)


### Bug Fixes

* **build:** Add auth config to all menu items. ([cea8982](https://github.com/lowdefy/lowdefy/commit/cea898252dd3f94b89107c15d7aeb889650a9e04))
* **build:** Nested context caused request to be created in wrong context. ([16e2b15](https://github.com/lowdefy/lowdefy/commit/16e2b154d44d3f532fe5be805dabcf0560129dd5))
* **build:** Page auth config fixes. ([601c942](https://github.com/lowdefy/lowdefy/commit/601c942e4fe5f7ed14fc209a5107dd25c65c1afa))
* **build:** Throw when poth protected and public pages are listed. ([5581ac4](https://github.com/lowdefy/lowdefy/commit/5581ac4bb003eb0e0d32320438388ad2af81f9a5))


### Features

* **build:** Add auth to build arifacts. ([c6a2e53](https://github.com/lowdefy/lowdefy/commit/c6a2e53a2fa0611e2a0f0d4b79fba9f26da66d4e))
* **graphql:** Make JWT expiry time configurable. ([30bde0b](https://github.com/lowdefy/lowdefy/commit/30bde0be4eb68f59818fdb3738f82c9b0e2e86a2))
* use setHeader plugin to set auth headers ([6238c6f](https://github.com/lowdefy/lowdefy/commit/6238c6f6ba6c1d24720f4867da7e5e577ff344d4))
* **build:** Add auth field and homePageId to config in app schema. ([a878a31](https://github.com/lowdefy/lowdefy/commit/a878a31160daa9e08b9ace838c3d5eb54b1d805e))
* **build:** Update app OpenID configuration schema ([a6df3c0](https://github.com/lowdefy/lowdefy/commit/a6df3c0f65dc5a048ca303a14743ff46f7b6b35a))





## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

**Note:** Version bump only for package @lowdefy/build





## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)


### Bug Fixes

* **build:** Start schema error messages with a new line ([80110c5](https://github.com/lowdefy/lowdefy/commit/80110c5fe4e313447df3399d097e2fac628cb4e3))





# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)


### Bug Fixes

* **build:** Add action messages to app schema ([2aff1cb](https://github.com/lowdefy/lowdefy/commit/2aff1cbf3a2216ab4c97a2119a158381b305ca88))
* **deps:** Update dependency json5 to v2.2.0. ([d93df2b](https://github.com/lowdefy/lowdefy/commit/d93df2b82d15585c907f18e2a52c2fda7b23a71a))
* **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
* **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))





# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)


### Bug Fixes

* **build:** Fix TimelineList block location (renamed from Timeline). ([02c5dea](https://github.com/lowdefy/lowdefy/commit/02c5dea13ff5f87b385a3ac5408efe2e4fa8c3dc))





# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

**Note:** Version bump only for package @lowdefy/build





## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)


### Bug Fixes

* Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))





## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/build





# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)


### Bug Fixes

* **build:** Allow _ref path argument to be a _var. ([a8bd287](https://github.com/lowdefy/lowdefy/commit/a8bd287176a58eff5df5f79071119cce0fc4e0fa))





# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)


### Bug Fixes

* Fix blocks-color-seletors typo. ([b6ccedd](https://github.com/lowdefy/lowdefy/commit/b6ccedd355c53b5910ef398aff49d32968f34c2e))
* **build:** Add 'field' to block schema. ([4aa76e8](https://github.com/lowdefy/lowdefy/commit/4aa76e807743064cca8c5a51ee3d5c7ad536aff8))


### Features

* 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))





# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)


### Bug Fixes

* **build:** Add types object to app schema. ([bd40748](https://github.com/lowdefy/lowdefy/commit/bd40748afcbe3c31d83b7c2f169db9ae1285ea5d))
* **build:** Improve error message if _var receives invalid arguments. ([c52a942](https://github.com/lowdefy/lowdefy/commit/c52a94297aec0f39c88bd5f6ae6d22e6723fe27a))
* **build:** Improve warning message if menu’s page not found ([7df576a](https://github.com/lowdefy/lowdefy/commit/7df576a2689f8eb79b44ca5fa8d2af38126006e7))
* **build:** Update default locations. ([203175d](https://github.com/lowdefy/lowdefy/commit/203175d6a4b8c018c9d65ff7cb7248b10d4e4508))


### Features

* **build:** Do not cache block metas if served from localhost. ([58772af](https://github.com/lowdefy/lowdefy/commit/58772af17886570aa8108ce2f04c554f21f80027))
* Rename blocks “actions” field to “events”. ([8f2e998](https://github.com/lowdefy/lowdefy/commit/8f2e9986e72be368203c0479a28ad7c7a2511f10))
* **docs:** Add TitleInput and ParagraphInput. ([3e5b239](https://github.com/lowdefy/lowdefy/commit/3e5b2393227c579ea957380b78439ff016014385))





# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)


### Bug Fixes

* **build:** Fix app schema test tests. ([86917c0](https://github.com/lowdefy/lowdefy/commit/86917c0f79ca75321af5d89e2f29e9328debec50))
* **build:** Fix lowdefy app schema. ([f33c151](https://github.com/lowdefy/lowdefy/commit/f33c151dfbe1a2ea55ead94c0fc6ef2573f34875))


### Features

* **build:** Add licence field to app schema. ([a6f7c91](https://github.com/lowdefy/lowdefy/commit/a6f7c910f629884942424f0f177614ca8c3c45ae))





# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)


### Bug Fixes

* **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
* **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))


### Features

* **build:** Add transformer function option to _ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
* **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
* Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))





# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)


### Bug Fixes

* **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
* **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))


### Features

* **build:** Add transformer function option to _ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
* **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
* Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))





# [0.1.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/build@0.0.0-alpha.7...@lowdefy/build@0.1.0) (2020-12-15)


### Features

* **build:** Add user defined loading property to blocks. ([bc87408](https://github.com/lowdefy/lowdefy/commit/bc87408edfb12b71286da9c2cf678b101dae9bd3))





# [0.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/build@0.0.0-alpha.7...@lowdefy/build@0.0.0) (2020-12-15)


### Features

* **build:** Add user defined loading property to blocks. ([bc87408](https://github.com/lowdefy/lowdefy/commit/bc87408edfb12b71286da9c2cf678b101dae9bd3))





# 0.0.0-alpha.7 (2020-12-10)


### Bug Fixes

* **ajv:** fix ajv validate parameter name ([5aba723](https://github.com/lowdefy/lowdefy/commit/5aba7230fec264cc12a8dcbd578da098ef3afe0e))
* **build:** add contextId to saved request file path ([81219b5](https://github.com/lowdefy/lowdefy/commit/81219b5c1dd8b26e213da9e4ab72178ac70ba812))
* **build:** add visible to block schema. ([4865208](https://github.com/lowdefy/lowdefy/commit/4865208416b7cccb0719984b1fb10813084dfbc1))
* **build:** app schema fix, add style on block ([a39c1ca](https://github.com/lowdefy/lowdefy/commit/a39c1ca83b8a859e87c764536c042edcce29f110))
* **build:** fix build issues ([0f1bd9c](https://github.com/lowdefy/lowdefy/commit/0f1bd9c5176b3d7472bf41d77e90dde491225564))
* **build:** fix local run script ([c69ee94](https://github.com/lowdefy/lowdefy/commit/c69ee94c057ef1ed1b0a29d88c0a3b475f62dcd1))
* **build:** Fix lowdefy schema, closes [#269](https://github.com/lowdefy/lowdefy/issues/269) ([09105a9](https://github.com/lowdefy/lowdefy/commit/09105a99b33bb358aac17593b4ad29906a461791))
* **build:** Icon block is part of blocks-antd package ([8507556](https://github.com/lowdefy/lowdefy/commit/8507556c10a9e076cf0d769a739d5687f3385482))
* **build:** improve error if block meta can not be found ([03dccb1](https://github.com/lowdefy/lowdefy/commit/03dccb169d71c9bb417d3754615d50937abfb38d)), closes [#121](https://github.com/lowdefy/lowdefy/issues/121)
* **build:** in shcema areas.content.block must be an array ([f53dcb8](https://github.com/lowdefy/lowdefy/commit/f53dcb8fffd18624b5f8b3aee11c5ed785c8d1e7))
* **build:** remove test file from git ignore ([c16ad0b](https://github.com/lowdefy/lowdefy/commit/c16ad0b5b17dc4b093ff5972ab7f27b6d987b749))
* **build:** remove unneccesary cli logs ([1f27b7d](https://github.com/lowdefy/lowdefy/commit/1f27b7d5d2c739fbffa21a04971c674fe9ce26cd))
* **build:** write block metas to meta folder in cache ([d6277a5](https://github.com/lowdefy/lowdefy/commit/d6277a59bb2561ac26d6cb4e292e0888f0da5bb4))
* **build:** write config object to output in build ([46ec66d](https://github.com/lowdefy/lowdefy/commit/46ec66d9e0330fafb323cbea2bdd3118a48eb7c4))
* **deps:** update dependency axios to v0.21.0 ([aee32c0](https://github.com/lowdefy/lowdefy/commit/aee32c0b37646e07bc8d5eeff7947e3af84ceb2c))
* **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
* **deps:** update dependency uuid to v8.3.2 ([abca08f](https://github.com/lowdefy/lowdefy/commit/abca08f599ec689e45ac208670bceb6f4fa2b089))
* move file helpers to new node-utils package ([0a6ef8d](https://github.com/lowdefy/lowdefy/commit/0a6ef8d09b6f1a75c8a8ceb1749f7dfe14c46b5f))


### Features

* **blocksTools:** mockBlockProps to provide schema errors ([6c192d4](https://github.com/lowdefy/lowdefy/commit/6c192d42b0ab9521b9c74a3a1466b03d414864bb))
* **build:** add block meta loader ([2a483ad](https://github.com/lowdefy/lowdefy/commit/2a483ad8e6237771eb485cad11364c85883b6943))
* **build:** add build context ([0f13e41](https://github.com/lowdefy/lowdefy/commit/0f13e4114dc96a9af918452918614cd13d8930a1))
* **build:** add build pages function ([01e892f](https://github.com/lowdefy/lowdefy/commit/01e892fad5d4c6c5c59406501cd936668b244085))
* **build:** add buildRefs function ([3ab2819](https://github.com/lowdefy/lowdefy/commit/3ab2819944fc3f7dd122e18b8e90ac24e832a5c9))
* **build:** add clean directory util ([127eb39](https://github.com/lowdefy/lowdefy/commit/127eb397134811126253d4feb820e421faaa71e5))
* **build:** add cleanOutputDirectory function ([e3a3bf9](https://github.com/lowdefy/lowdefy/commit/e3a3bf9952f7a07e981cd5ef2e38cfd60c68e636))
* **build:** add color selector defaultMetaLocations ([6c28a66](https://github.com/lowdefy/lowdefy/commit/6c28a6683c32062f457991ad7746d1eb321bb223))
* **build:** add defaultMetaLocations ([fe14001](https://github.com/lowdefy/lowdefy/commit/fe140013df9c145c457be2c039747f39c64983bf))
* **build:** add error messages to lowdefy schema ([6fd15f0](https://github.com/lowdefy/lowdefy/commit/6fd15f0bbcd031a79c215321b195a0fe0fae34b4))
* **build:** add getFileExtension util ([46586f0](https://github.com/lowdefy/lowdefy/commit/46586f05f2db9d87493c511a79f9047ee30829b6))
* **build:** add schema test utils ([bb0574f](https://github.com/lowdefy/lowdefy/commit/bb0574fb1da37286fc19ba2bade7b458b4c8fc36))
* **build:** add test schema function, cleanup ([ac216d4](https://github.com/lowdefy/lowdefy/commit/ac216d448396d49e5e08a64244d5c404ad08ef91))
* **build:** add util functions ([8686857](https://github.com/lowdefy/lowdefy/commit/8686857222f52f9939df9c2644e444f96978c3ee))
* **build:** add write functions ([701b583](https://github.com/lowdefy/lowdefy/commit/701b583a6d29a03eedaed5899b48cf94641c3694))
* **build:** build connections and menus ([3f4b486](https://github.com/lowdefy/lowdefy/commit/3f4b486459574e38d9e33c0c9b8b1ac0b918a31f))
* **build:** cleanup, test fixes ([1c1792b](https://github.com/lowdefy/lowdefy/commit/1c1792b6906d1a8d90e3eff811fb978995d8e9b1))
* **build:** init package @lowdefy/build ([6f7f73b](https://github.com/lowdefy/lowdefy/commit/6f7f73bbe021f41b82c347130dfe79a40d5e2273))
* **build:** remove mutations ([1e9801b](https://github.com/lowdefy/lowdefy/commit/1e9801b6ac4be70f1f30635ac450394f0c0db973))
* **build:** update app schema ([fc40948](https://github.com/lowdefy/lowdefy/commit/fc40948b488a2e3a105c8dcb123a4fe26e096aeb))
* **build:** use @lowdefy/ajv for json schema checks ([98eb4be](https://github.com/lowdefy/lowdefy/commit/98eb4be30cf217b9db0dd27e8c68ddadb480b67e))
* **build:** write pages and requests ([fc6176d](https://github.com/lowdefy/lowdefy/commit/fc6176d312dbcaaa9238d2c1990bb8c414596028))
* **cli:** add errorBoundary and getLowdefyVersion utils ([519e604](https://github.com/lowdefy/lowdefy/commit/519e6047714a8e32072eaacaa111eff666b69e71))
* **cli:** improve cli console logs ([7ca7509](https://github.com/lowdefy/lowdefy/commit/7ca7509e2696e2380a02aded5b22d6bd9b1ec62f)), closes [#247](https://github.com/lowdefy/lowdefy/issues/247)
* **cli:** init cli with build command ([92fff8f](https://github.com/lowdefy/lowdefy/commit/92fff8f157ce6ac2d2df09dac7f8f2073e120b63))
* **cli:** init dev server ([7eae1a8](https://github.com/lowdefy/lowdefy/commit/7eae1a80f456f0987c8835a3966ca5a7a6a80018))
* **cli:** init module federation of build script ([34dba01](https://github.com/lowdefy/lowdefy/commit/34dba017246b38b940f6614d66def34844f9e961))
* update webpack configs ([bcce3c8](https://github.com/lowdefy/lowdefy/commit/bcce3c85cea5857e429f1821785ffb939dcaa52a))
* **helpers:** move file utilities to helpers ([1159ac7](https://github.com/lowdefy/lowdefy/commit/1159ac71e7e1029c8c9d94e1826fea2f72d76aa9))
