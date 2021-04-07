# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/engine





## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)


### Bug Fixes

* **engine:** Fix Request action response. ([45aaa18](https://github.com/lowdefy/lowdefy/commit/45aaa1854595da1eb5225198a101895dc959fe54))





## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/engine





## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/engine





## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/engine





## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/engine





# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/engine





## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/engine





## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/engine





## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/engine





## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/engine





# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)


### Bug Fixes

* **engine:** Assign rootContext to context, instead of assigning individual fields. ([9461990](https://github.com/lowdefy/lowdefy/commit/9461990863b76d790a55d77fef5278adc4619858))
* **engine:** Rename more root to lowdefy. ([df858c1](https://github.com/lowdefy/lowdefy/commit/df858c16aaeaa6116fd3701cac1bcbdce77e526d))
* **engine:** Rename rootContext to lowdefy, and add pageId to root. ([3ee8807](https://github.com/lowdefy/lowdefy/commit/3ee880702f4edd060b011c1cf22a5015982965c9))
* **engine:** Use context specific pageId in engine. ([e80e461](https://github.com/lowdefy/lowdefy/commit/e80e461ebaa5a6453866f780b0ad4d3e9f2f2237))


### Features

* **renderer:** Finish OpenId callback. ([9997136](https://github.com/lowdefy/lowdefy/commit/9997136f395c1f7fb7d16ef8fdb6f0cd6043a951))
* **renderer:** Switch rootcontext to root lowdefy object ([30919a2](https://github.com/lowdefy/lowdefy/commit/30919a2dd2e2ee9adffbe35f382ba70e78fac25e))
* Init OpenID Connect flow. ([e2e29d0](https://github.com/lowdefy/lowdefy/commit/e2e29d0f165c148bbc27b5073612a6b4d50e1b87))





## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)


### Bug Fixes

* **engine:** Validate was not showing the correct error message. ([4fcbda4](https://github.com/lowdefy/lowdefy/commit/4fcbda45ebafb6b40b93d865a648234ca19f505f))
* **engine:** Validation warnings were shown as errors not warnings. ([84ad6b3](https://github.com/lowdefy/lowdefy/commit/84ad6b3b98fb28e770262898cdc41373f3f919a7))





## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

**Note:** Version bump only for package @lowdefy/engine





# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)


### Bug Fixes

* **engine:** Fix Link action always errors. ([ec4c0f2](https://github.com/lowdefy/lowdefy/commit/ec4c0f24dcf5715ca8230d20b253a74afcdcccb5))
* **engine:** Fix set block to update on event loading. ([db80390](https://github.com/lowdefy/lowdefy/commit/db8039079ecfb5484f49f0a921e326fda4342050))
* **engine:** Use displayMessage from window. ([a7e50b3](https://github.com/lowdefy/lowdefy/commit/a7e50b39da5a37efc16dc15d2f3e56a4bac820f6))





# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)


### Bug Fixes

* **actions:** Fix action response, add tests. ([0d16f82](https://github.com/lowdefy/lowdefy/commit/0d16f82a92135e0e895bd2088d4386b0f01b67d7))
* **engine:** Fix Link action with input and urlQuery. ([be6a1e1](https://github.com/lowdefy/lowdefy/commit/be6a1e1e8801458d059fe937d517b777c41fee71))
* **engine:** Fix Validate function name ([795d876](https://github.com/lowdefy/lowdefy/commit/795d8765e18f5c3c5a1e3b44133e9785fad3aad2))
* **engine:** Log action errors to the console. ([38ea5ff](https://github.com/lowdefy/lowdefy/commit/38ea5ff430d766f3b178b3746aeac6c6c8cb78d6))


### Features

* **engine:** Parse params for all actions. Refactor actions and events. ([0d55bd2](https://github.com/lowdefy/lowdefy/commit/0d55bd2624917a8415802db7413ebe4e06e1c111))





# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)


### Bug Fixes

* **engine:** Fix container chlidren visibilty if container vis is null. ([0af48bd](https://github.com/lowdefy/lowdefy/commit/0af48bdc5b9ea201118e76b3479180c15498fbaf))


### Features

* **engine:** Rename Link action newWindow to newTab. ([35b47f6](https://github.com/lowdefy/lowdefy/commit/35b47f6d47338b3f93ae41a0fcd2046b5593db50))





## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)


### Bug Fixes

* Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))





## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/engine





# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)


### Bug Fixes

* **engine:** Actions should only skip when “skip” is explicitly true ([e34dc05](https://github.com/lowdefy/lowdefy/commit/e34dc056d11709d2d319f36a052f27dea0ec7cc6))
* **engine:** Only update when onInit is done. ([9f21597](https://github.com/lowdefy/lowdefy/commit/9f215976ffd44caa96c75e0ba929f750819b2e36))





# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)


### Bug Fixes

* **engine:** Events rename fix. ([ca142ca](https://github.com/lowdefy/lowdefy/commit/ca142ca160a8e3db911ed70f571be31ef5f60d42))





# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)


### Bug Fixes

* **deps:** Update dependency graphql to v15.5.0 ([90acf72](https://github.com/lowdefy/lowdefy/commit/90acf7289c517f9afe066cd0706c64187a39648b))


### Features

* Rename blocks “actions” field to “events”. ([8f2e998](https://github.com/lowdefy/lowdefy/commit/8f2e9986e72be368203c0479a28ad7c7a2511f10))
* **engine:** Add support for meta.initValue to initialize block value from meta. ([5d5307c](https://github.com/lowdefy/lowdefy/commit/5d5307c82a45d7120870fae1c0abc1ea9caf5005))
* **engine:** Rename block actions to events ([bd4f7a7](https://github.com/lowdefy/lowdefy/commit/bd4f7a79e3039d2dcc9a8e0e5663d560cbc6c8bb))
* **renderer:** Rename actions to events ([134b275](https://github.com/lowdefy/lowdefy/commit/134b2756fd7f544486d9b1f8f5b53fa566fce23f))





# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/engine





# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)


### Bug Fixes

* Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))





# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)


### Bug Fixes

* Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))





## [0.0.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/engine@0.0.0-alpha.7...@lowdefy/engine@0.0.1) (2020-12-15)

**Note:** Version bump only for package @lowdefy/engine





# [0.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/engine@0.0.0-alpha.7...@lowdefy/engine@0.0.0) (2020-12-15)

**Note:** Version bump only for package @lowdefy/engine





# 0.0.0-alpha.7 (2020-12-10)


### Bug Fixes

* **blockTools:** remove registeredMethods ([b984e6f](https://github.com/lowdefy/lowdefy/commit/b984e6f5554a617d4d8d7e077e91619330d0eb4d))
* **deps:** update dependency graphql to v15.4.0 ([24803a3](https://github.com/lowdefy/lowdefy/commit/24803a30d4fe6fb140c28891691fc1fab6537d5f))
* **engine:** do not recreate actions on call ([58f6e8e](https://github.com/lowdefy/lowdefy/commit/58f6e8ed5698df4bb7f1853c75266d7264b7156a))
* **engine:** minor bug fixes ([8937087](https://github.com/lowdefy/lowdefy/commit/8937087274bfba78d0433cada9a3d28c288fa0b7))
* **engine:** remove defaultValue field ([a380aef](https://github.com/lowdefy/lowdefy/commit/a380aefea5b30077ab662d3abefd412e5b0695b8))
* **engine:** replace graphql-tag dependency in engine ([370f69b](https://github.com/lowdefy/lowdefy/commit/370f69be4e91d0bbbb4a72f50abadbdfe8319e50))
* **engine:** structured params for newBlocks ([1c5bd0c](https://github.com/lowdefy/lowdefy/commit/1c5bd0c4734d11767065a2bb605c59b947db4750))
* **engine:** update tests ([4de3325](https://github.com/lowdefy/lowdefy/commit/4de332549a690c41b31944876dbf15d7f4a76a24))
* **engine:** visible should evaluate only when not equal to false ([76e7f2a](https://github.com/lowdefy/lowdefy/commit/76e7f2a6589593bf0eaa3cecbf01214df9edf727))
* **renderer:** fix useContext, split onEnter and get context ([6af60c6](https://github.com/lowdefy/lowdefy/commit/6af60c6703f0fc119d0b44b6328a2ad1e8278ba6))
* build and test errors ([909b2bf](https://github.com/lowdefy/lowdefy/commit/909b2bf1250d26b1fd944811117770a35f187a09))
* move engine related files from helpers to engine ([3b96ab7](https://github.com/lowdefy/lowdefy/commit/3b96ab7e0e651ca54a4861d90a9fe732a3d1fe21))
* requests fixes ([0e7af60](https://github.com/lowdefy/lowdefy/commit/0e7af6093210a030129200c7abfe330c30cf1574))
* use helpers from helpers ([ebe3738](https://github.com/lowdefy/lowdefy/commit/ebe373827d54f4009f5f246fef8be630e20ba4a7))
* **renderer, engine:** move displayMessage to rootContext, update engine tests ([0f6339f](https://github.com/lowdefy/lowdefy/commit/0f6339f07d0b00aa86cce8c501ebae7fd6157ea7))


### Features

* **engine:** init @lowdefy/engine package ([1604212](https://github.com/lowdefy/lowdefy/commit/160421241933611936321cdc64255a462384646a))
* **engine:** refactor validation messages and only eval visible ([a507cc3](https://github.com/lowdefy/lowdefy/commit/a507cc3ccb3506013bf66a3f14cebeabb374d742))
* **engine:** remove all empty objects from state as an effect of deleted values ([7cb2f2e](https://github.com/lowdefy/lowdefy/commit/7cb2f2e6fa6df1ed1ea4709c8567412602cce33e))
* **engine:** remove mutations ([68f8578](https://github.com/lowdefy/lowdefy/commit/68f85789eba4979d6ee77332250e649482d5127c))
* **engine:** validate action can be null = all, string = one or array = list of field names ([5a64c8b](https://github.com/lowdefy/lowdefy/commit/5a64c8b7b1dbf5594ec9865dd4a183cff8b8f018))
* add Apache-2.0 license ([3e2064e](https://github.com/lowdefy/lowdefy/commit/3e2064eef02dd71bb8987f8e126f9bef6cb7d01b))
* add type package ([d0c60c4](https://github.com/lowdefy/lowdefy/commit/d0c60c4bfab8ec9038f6cab67a87d658f6732dc9))
* remove fetch requests on page load, add async load actions ([1f396d6](https://github.com/lowdefy/lowdefy/commit/1f396d62ef204de1cde5ddeea0abe0bcf0c898c0))
* **engine, renderer:** move apollo cache block update to renderer ([778ff4a](https://github.com/lowdefy/lowdefy/commit/778ff4aa99ce986b4ad43629cec9e3b82bde714f))
