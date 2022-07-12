# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)


### Bug Fixes

* Read urlQuery from location where used, not on lowdefy. ([11541e4](https://github.com/lowdefy/lowdefy/commit/11541e4722359bb57bace8298fc475caf58dbf6e))





# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/client





# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)


### Features

* Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))





# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)


### Bug Fixes

* **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
* **client:** Remove area and layout default object. ([27a56f1](https://github.com/lowdefy/lowdefy/commit/27a56f18e6e71faa51696d014b41b97744a3ff57))
* **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))


### Features

* Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
* Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
* Move browser globals to lowdefy._internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))



# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)



# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)





# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)


### Bug Fixes

* **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
* **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))


### Features

* Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
* Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
* Move browser globals to lowdefy._internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))





# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/client





# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/client





# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/client





# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)


### Bug Fixes

* **engine:** RootBlocks.map to use blockId. ([d31064f](https://github.com/lowdefy/lowdefy/commit/d31064ff9c685d1ae959ce9142ac11aca55fb6c0))
* Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
* Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))


### Features

* Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
* React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))
* Set login providerId if only one provider is configured. ([8bc34a1](https://github.com/lowdefy/lowdefy/commit/8bc34a1b0533e6231bfdc2655ba48e1df701a772))





# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)


### Bug Fixes

* **client:** Clean up use effect hook. ([413c697](https://github.com/lowdefy/lowdefy/commit/413c697a08c429c39100f9a23298e591bc194ed4))
* **client:** On mount async method should always be called. ([912e405](https://github.com/lowdefy/lowdefy/commit/912e40522999e8e8b7eb65ec2855f43fab9c759b))





# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)


### Bug Fixes

* Adapt createAuthMethods for client package. ([4675297](https://github.com/lowdefy/lowdefy/commit/467529780bc1c90a089f6b157e264e5fbe10ca63))
* Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
* **client:** Fix setupLink - createLink needs lowdefy for input. ([314f131](https://github.com/lowdefy/lowdefy/commit/314f131ceb82bc39cf339dd2e6dfdf56aadb8543))
* Remove user from block properties. ([7cadf63](https://github.com/lowdefy/lowdefy/commit/7cadf6389a3c50fafbb4834f099e6514cad790bd))


### Features

* Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
* **server:** Add read user object from next-auth session. ([fbab7f1](https://github.com/lowdefy/lowdefy/commit/fbab7f14e7a23fcc82f4a7e1903c4aafdda8169d))
* Use next-auth session to authenticate in api. ([462c0ac](https://github.com/lowdefy/lowdefy/commit/462c0ac0d05429514ecd2a2b11a6a21b8915b462))


### BREAKING CHANGES

* Removed user from block properties.





# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/client





# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)


### Bug Fixes

* **client:** Fix setupLink - createLink needs lowdefy for input. ([f152ac2](https://github.com/lowdefy/lowdefy/commit/f152ac2c5ef0bf3dc085fbe7e89648ac2ca7c550))
* **client:** Render progress bar next to context, and event order fixes. ([fc32c75](https://github.com/lowdefy/lowdefy/commit/fc32c75ea2d8c5c97e21280b09fce5518ec14d37))


### Features

* **client:** Add display message implementation. ([f94ee32](https://github.com/lowdefy/lowdefy/commit/f94ee32a797b61b5f0f2bcc4de429b815f6de864))
* **client:** Apply reset context flag to recreate context on client. ([09f49a2](https://github.com/lowdefy/lowdefy/commit/09f49a2072f2803268b20f69655e03a57ef8f097))
* **client:** Init @lowdefy/client. ([bb7931d](https://github.com/lowdefy/lowdefy/commit/bb7931d0da4ca3614ae4223ca19663a9088d2a45))
