# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)


### Bug Fixes

* **deps:** Update dependency mingo to v4.1.2. ([eb57a01](https://github.com/lowdefy/lowdefy/commit/eb57a01b4a3e2859659462b1865ddb06656f98b1))





## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)


### Bug Fixes

* **operators:** Getter operators should not error if key is null. ([d080e5a](https://github.com/lowdefy/lowdefy/commit/d080e5aac405795ade11bf9bc296fc59d8266e60))





# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)


### Bug Fixes

* **deps:** Update dependency mingo to v4.1.1. ([efdb838](https://github.com/lowdefy/lowdefy/commit/efdb838fdf3b002f5799e04c5d5de1dc721dabdc))





# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

**Note:** Version bump only for package @lowdefy/operators





# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)


### Bug Fixes

* **operators:** Allow get from object to take an integer argument. ([e8bdbd9](https://github.com/lowdefy/lowdefy/commit/e8bdbd96a3bf776365d77f9c0800c3c732ea0fbe))
* **operators:** Block experimental operators in _operator. ([342b636](https://github.com/lowdefy/lowdefy/commit/342b636468031905a45e2da66b455ce74469ada5))


### Features

* **operators:** Add _format operator. ([44839da](https://github.com/lowdefy/lowdefy/commit/44839daf959253660b6d3c97204898cad0e464fb))
* **operators:** Add _index operator. ([995a912](https://github.com/lowdefy/lowdefy/commit/995a9128e38a27d4e2fdad8c7b6459ee2640c120))
* **operators:** Add experimental javascript operator ([9b7998c](https://github.com/lowdefy/lowdefy/commit/9b7998c174ed0eb6cb0e6054aa0f3334e404f7d8))





## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)


### Bug Fixes

* Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))





## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/operators





# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

**Note:** Version bump only for package @lowdefy/operators





# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

**Note:** Version bump only for package @lowdefy/operators





# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)


### Bug Fixes

* **operators:** Fix error when operator not supported, add support for _global ([8ba32aa](https://github.com/lowdefy/lowdefy/commit/8ba32aa7b4e23311b27043cd64782b75063a60b3))


### Features

* **operators:** Add _event operator. ([a869441](https://github.com/lowdefy/lowdefy/commit/a869441bf6fdd4cf44e6d5c03f74ea466fa6f027))
* **operators:** Add _function operator. ([07f7e6f](https://github.com/lowdefy/lowdefy/commit/07f7e6f68ff90c742bb6fb7403bfc53cb0593cb7))
* **operators:** Add array methods that use functions. ([49f6a93](https://github.com/lowdefy/lowdefy/commit/49f6a9301e793181f7460bcdddd670969c26fd34))
* **operators:** Rename _action_log operator to _event_log ([dd2af60](https://github.com/lowdefy/lowdefy/commit/dd2af60f67fc095d0e5e9583764c174bae9cd062))





# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)


### Bug Fixes

* **operators:** getFromObject should copy object if getting entire obj ([32f0cbc](https://github.com/lowdefy/lowdefy/commit/32f0cbcf813376ad48bd50e375065a536e8f0e35))
* **operators:** Update test error message snapshots. ([1b49ba2](https://github.com/lowdefy/lowdefy/commit/1b49ba233110265db8fb26a8f6294e6e4518b46f))
* _lt, _lte, _gt, _gte not to throw on non numerics. ([0bad71d](https://github.com/lowdefy/lowdefy/commit/0bad71d2276cdab85b37bba6ada7e859ec7f51fb))
* Temporarily log parser errors to console. ([a43b386](https://github.com/lowdefy/lowdefy/commit/a43b3860354142815e173fc6875f663e018525c7))





# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)


### Bug Fixes

* Fix location not defined. ([90f1e25](https://github.com/lowdefy/lowdefy/commit/90f1e25594f5ef9cb8f0a6c75e51809a0cb2da6d))
* **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
* Change allowed properties and methods to Sets. ([8b91c21](https://github.com/lowdefy/lowdefy/commit/8b91c211806303ec16a07f23fea50836e91e27c6))
* Change to mingo system import file. ([a540435](https://github.com/lowdefy/lowdefy/commit/a540435870977a3274c5a057f08dbbe6dca929f4))
* Evaluate _math using runMethod. ([3f06967](https://github.com/lowdefy/lowdefy/commit/3f06967282a456290907f30586f6e4dcdc7b94b2))
* Give defaultFunction to runClass and error in undefined methodName. ([38af83b](https://github.com/lowdefy/lowdefy/commit/38af83b3fc8fed64427b79ee17275585151259a8))
* Make all method operators work with runClass and runInstance. ([ef58619](https://github.com/lowdefy/lowdefy/commit/ef58619e87d7dd50d045f7dd04587209f8a7679a))
* project operator import typo ([84ea45e](https://github.com/lowdefy/lowdefy/commit/84ea45e0c169194352a716910ecb9a3fc9312114))
* Rename _base64_encode and _base64_decode to _base64.encode and _base64.decode. ([8ded919](https://github.com/lowdefy/lowdefy/commit/8ded919d17653852ad764d9210a9c0ae020086aa))
* Rename _uri_encode and _uri_decode to _uri.encode and _uri.decode. ([bb0e9b4](https://github.com/lowdefy/lowdefy/commit/bb0e9b4df16fa6ca89c6060d1698db76cd6720e0))
* Update error message for unsupported method. ([285a6cb](https://github.com/lowdefy/lowdefy/commit/285a6cb9284d0d07e02712004539622484797f8b))
* Update runInstance and runClass to cover all function types. ([bc49186](https://github.com/lowdefy/lowdefy/commit/bc491863e311f32fd30f6f46af412d5a09edd6ca))


### Features

* Add _array, _object and _string operators. ([39197f7](https://github.com/lowdefy/lowdefy/commit/39197f760119c16ad6036259a30060a3c67f2e82))
* Add _base64_encode and _base64_decode operators. ([25eb55a](https://github.com/lowdefy/lowdefy/commit/25eb55a5cd920bc219d24a25126faf227068e196))
* Add _diff operator on NodeParser. ([ea65823](https://github.com/lowdefy/lowdefy/commit/ea6582330998834deaeb6d1a5184573fb15700a3))
* Add _divide operator. ([cc57d5d](https://github.com/lowdefy/lowdefy/commit/cc57d5dd01879ed019cdc190694fd54e1eb3babc))
* Add _gt, _gte, _lt, _lte operators. ([e9d3bba](https://github.com/lowdefy/lowdefy/commit/e9d3bba6ef12facc16d70d3f1bf6e0c752d0c3ad))
* Add _if_none operator. ([6ee7e42](https://github.com/lowdefy/lowdefy/commit/6ee7e42c27dcdd2def6f73a06fd022d4a67e223c))
* Add _json.parse and _json.stringify to replace _json_parse and _json_stringify. ([b83749f](https://github.com/lowdefy/lowdefy/commit/b83749f7655eb21dcdfed57c2cb968bac45e5227))
* Add _log operator. ([735cea0](https://github.com/lowdefy/lowdefy/commit/735cea080dbb34a0f91f6a3d112bc6e274d1a216))
* Add _math operator. ([9c447f7](https://github.com/lowdefy/lowdefy/commit/9c447f7ebbb4d1824b97c661c65addb7fd5d4c42))
* Add _media operator. ([fc860ad](https://github.com/lowdefy/lowdefy/commit/fc860ad7091b7b7b74c9b347a2674c98daa4feac))
* Add _mql to replace _mql_aggregate, _mql_test, _mql_expr. ([20e16bc](https://github.com/lowdefy/lowdefy/commit/20e16bc2bf18c71b7ae0dac6252966982e7c11b7))
* Add _product operator. ([54704de](https://github.com/lowdefy/lowdefy/commit/54704de97629096118e75f5e19cb38c03024b1c0))
* Add _random operator. ([41d1960](https://github.com/lowdefy/lowdefy/commit/41d19608b437c0cc6b81a530343dea3450b2942c))
* Add _subtract operator. ([0f1c1c6](https://github.com/lowdefy/lowdefy/commit/0f1c1c6d8bf750b78aec38b375dbe18761553dbe))
* Add _sum operator. ([05e5a8d](https://github.com/lowdefy/lowdefy/commit/05e5a8d44098c2433e7c2e60379e3c4f02de25c5))
* Add _uri_encode and _uri_decode operators. ([bdb0eb8](https://github.com/lowdefy/lowdefy/commit/bdb0eb8e49768d9f3b1f969b4503e488a2db340d))
* Add _uuid operator to NodeParser. ([0f562fe](https://github.com/lowdefy/lowdefy/commit/0f562feff59167be3431c04cb1aa65a678eba400))
* Allow method dot notation for operations, and parser performance improvement. ([f0c1711](https://github.com/lowdefy/lowdefy/commit/f0c171179a06152cf756542166c0c37005a7ba29))
* Ignore operator objects with more than one key. ([225a543](https://github.com/lowdefy/lowdefy/commit/225a543a1ecc27b0c624726add3b014d24cec68c))
* Rename _parse to _json_parse, _stringify to _json_stringify, _dump_yaml to _yaml_stringify,  _load_yaml to _yaml_parse. ([ac6eb0a](https://github.com/lowdefy/lowdefy/commit/ac6eb0ab1af02854d93eedfdfb643f0bc664663a))
* Replace _yaml_parse and _yaml_stringify with _yaml.parse and _yaml.stringify. ([d61a316](https://github.com/lowdefy/lowdefy/commit/d61a3165631c97c075b1f8c8f0bf6285d6d8958f))
* Rewrite date to us runClass. ([9fe2698](https://github.com/lowdefy/lowdefy/commit/9fe2698f19b3cc622bb2da95c8c43c9df2a819d8))
* Throw error on _divide by zero. ([3d0047d](https://github.com/lowdefy/lowdefy/commit/3d0047d8f9924d513a6cd0afd617275e4f2234ac))





# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)


### Bug Fixes

* Fix location not defined. ([90f1e25](https://github.com/lowdefy/lowdefy/commit/90f1e25594f5ef9cb8f0a6c75e51809a0cb2da6d))
* **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
* Change allowed properties and methods to Sets. ([8b91c21](https://github.com/lowdefy/lowdefy/commit/8b91c211806303ec16a07f23fea50836e91e27c6))
* Change to mingo system import file. ([a540435](https://github.com/lowdefy/lowdefy/commit/a540435870977a3274c5a057f08dbbe6dca929f4))
* Evaluate _math using runMethod. ([3f06967](https://github.com/lowdefy/lowdefy/commit/3f06967282a456290907f30586f6e4dcdc7b94b2))
* Give defaultFunction to runClass and error in undefined methodName. ([38af83b](https://github.com/lowdefy/lowdefy/commit/38af83b3fc8fed64427b79ee17275585151259a8))
* Make all method operators work with runClass and runInstance. ([ef58619](https://github.com/lowdefy/lowdefy/commit/ef58619e87d7dd50d045f7dd04587209f8a7679a))
* project operator import typo ([84ea45e](https://github.com/lowdefy/lowdefy/commit/84ea45e0c169194352a716910ecb9a3fc9312114))
* Rename _base64_encode and _base64_decode to _base64.encode and _base64.decode. ([8ded919](https://github.com/lowdefy/lowdefy/commit/8ded919d17653852ad764d9210a9c0ae020086aa))
* Rename _uri_encode and _uri_decode to _uri.encode and _uri.decode. ([bb0e9b4](https://github.com/lowdefy/lowdefy/commit/bb0e9b4df16fa6ca89c6060d1698db76cd6720e0))
* Update error message for unsupported method. ([285a6cb](https://github.com/lowdefy/lowdefy/commit/285a6cb9284d0d07e02712004539622484797f8b))
* Update runInstance and runClass to cover all function types. ([bc49186](https://github.com/lowdefy/lowdefy/commit/bc491863e311f32fd30f6f46af412d5a09edd6ca))


### Features

* Add _array, _object and _string operators. ([39197f7](https://github.com/lowdefy/lowdefy/commit/39197f760119c16ad6036259a30060a3c67f2e82))
* Add _base64_encode and _base64_decode operators. ([25eb55a](https://github.com/lowdefy/lowdefy/commit/25eb55a5cd920bc219d24a25126faf227068e196))
* Add _diff operator on NodeParser. ([ea65823](https://github.com/lowdefy/lowdefy/commit/ea6582330998834deaeb6d1a5184573fb15700a3))
* Add _divide operator. ([cc57d5d](https://github.com/lowdefy/lowdefy/commit/cc57d5dd01879ed019cdc190694fd54e1eb3babc))
* Add _gt, _gte, _lt, _lte operators. ([e9d3bba](https://github.com/lowdefy/lowdefy/commit/e9d3bba6ef12facc16d70d3f1bf6e0c752d0c3ad))
* Add _if_none operator. ([6ee7e42](https://github.com/lowdefy/lowdefy/commit/6ee7e42c27dcdd2def6f73a06fd022d4a67e223c))
* Add _json.parse and _json.stringify to replace _json_parse and _json_stringify. ([b83749f](https://github.com/lowdefy/lowdefy/commit/b83749f7655eb21dcdfed57c2cb968bac45e5227))
* Add _log operator. ([735cea0](https://github.com/lowdefy/lowdefy/commit/735cea080dbb34a0f91f6a3d112bc6e274d1a216))
* Add _math operator. ([9c447f7](https://github.com/lowdefy/lowdefy/commit/9c447f7ebbb4d1824b97c661c65addb7fd5d4c42))
* Add _media operator. ([fc860ad](https://github.com/lowdefy/lowdefy/commit/fc860ad7091b7b7b74c9b347a2674c98daa4feac))
* Add _mql to replace _mql_aggregate, _mql_test, _mql_expr. ([20e16bc](https://github.com/lowdefy/lowdefy/commit/20e16bc2bf18c71b7ae0dac6252966982e7c11b7))
* Add _product operator. ([54704de](https://github.com/lowdefy/lowdefy/commit/54704de97629096118e75f5e19cb38c03024b1c0))
* Add _random operator. ([41d1960](https://github.com/lowdefy/lowdefy/commit/41d19608b437c0cc6b81a530343dea3450b2942c))
* Add _subtract operator. ([0f1c1c6](https://github.com/lowdefy/lowdefy/commit/0f1c1c6d8bf750b78aec38b375dbe18761553dbe))
* Add _sum operator. ([05e5a8d](https://github.com/lowdefy/lowdefy/commit/05e5a8d44098c2433e7c2e60379e3c4f02de25c5))
* Add _uri_encode and _uri_decode operators. ([bdb0eb8](https://github.com/lowdefy/lowdefy/commit/bdb0eb8e49768d9f3b1f969b4503e488a2db340d))
* Add _uuid operator to NodeParser. ([0f562fe](https://github.com/lowdefy/lowdefy/commit/0f562feff59167be3431c04cb1aa65a678eba400))
* Allow method dot notation for operations, and parser performance improvement. ([f0c1711](https://github.com/lowdefy/lowdefy/commit/f0c171179a06152cf756542166c0c37005a7ba29))
* Ignore operator objects with more than one key. ([225a543](https://github.com/lowdefy/lowdefy/commit/225a543a1ecc27b0c624726add3b014d24cec68c))
* Rename _parse to _json_parse, _stringify to _json_stringify, _dump_yaml to _yaml_stringify,  _load_yaml to _yaml_parse. ([ac6eb0a](https://github.com/lowdefy/lowdefy/commit/ac6eb0ab1af02854d93eedfdfb643f0bc664663a))
* Replace _yaml_parse and _yaml_stringify with _yaml.parse and _yaml.stringify. ([d61a316](https://github.com/lowdefy/lowdefy/commit/d61a3165631c97c075b1f8c8f0bf6285d6d8958f))
* Rewrite date to us runClass. ([9fe2698](https://github.com/lowdefy/lowdefy/commit/9fe2698f19b3cc622bb2da95c8c43c9df2a819d8))
* Throw error on _divide by zero. ([3d0047d](https://github.com/lowdefy/lowdefy/commit/3d0047d8f9924d513a6cd0afd617275e4f2234ac))





## [1.1.2](https://github.com/lowdefy/lowdefy/compare/@lowdefy/operators@1.1.0...@lowdefy/operators@1.1.2) (2020-12-15)

**Note:** Version bump only for package @lowdefy/operators





## [1.1.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/operators@1.1.0...@lowdefy/operators@1.1.1) (2020-12-15)

**Note:** Version bump only for package @lowdefy/operators





# 1.1.0 (2020-12-10)


### Bug Fixes

* **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
* **deps:** update dependency mingo to v3.1.0 ([a2dedf5](https://github.com/lowdefy/lowdefy/commit/a2dedf5b93b24e730a506eb725dad8b1a35c0934))
* **operators:** _regex should not error but return false on empty value in state ([4ed9b85](https://github.com/lowdefy/lowdefy/commit/4ed9b859b263cd585e2a7a32ef83d2b3d6f87b86))
* **operators:** support arrayIndices in Node parser ([1785dc5](https://github.com/lowdefy/lowdefy/commit/1785dc523af114f268e96a8df0621c8eed876db0))
* use helpers from helpers ([ebe3738](https://github.com/lowdefy/lowdefy/commit/ebe373827d54f4009f5f246fef8be630e20ba4a7))


### Features

* **engine:** init @lowdefy/engine package ([1604212](https://github.com/lowdefy/lowdefy/commit/160421241933611936321cdc64255a462384646a))
* **operators:** init @lowdefy/operators package ([a59d523](https://github.com/lowdefy/lowdefy/commit/a59d523bb9d581baf6d19de5af26b27fd2577b32))
