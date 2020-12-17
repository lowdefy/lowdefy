# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.0.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/renderer@0.0.0-alpha.7...@lowdefy/renderer@0.0.1) (2020-12-15)

**Note:** Version bump only for package @lowdefy/renderer





# [0.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/renderer@0.0.0-alpha.7...@lowdefy/renderer@0.0.0) (2020-12-15)

**Note:** Version bump only for package @lowdefy/renderer





# 0.0.0-alpha.7 (2020-12-10)


### Bug Fixes

* **blockTools:** list prop must be an array on content() for list blocks to itterate over ([f30e229](https://github.com/lowdefy/lowdefy/commit/f30e229dace786643dc07e1cb8f6f0dada7e7394))
* **deps:** update dependency @apollo/client to v3.2.3 ([b00e2b6](https://github.com/lowdefy/lowdefy/commit/b00e2b6019e4a06d744031156d4e53858198ecab))
* **deps:** update dependency @apollo/client to v3.2.4 ([6119c22](https://github.com/lowdefy/lowdefy/commit/6119c22457f3e2f14a3758c1333836eec07e5414))
* **deps:** update dependency @apollo/client to v3.2.5 ([fd0aecd](https://github.com/lowdefy/lowdefy/commit/fd0aecd495bda4e439a0938a7c526dac61b0df1b))
* **deps:** update dependency @apollo/client to v3.2.6 ([a7440a3](https://github.com/lowdefy/lowdefy/commit/a7440a34100e38479ce37d9cac57d56f17ffb2e5))
* **deps:** update dependency @apollo/client to v3.2.9 ([f9d5438](https://github.com/lowdefy/lowdefy/commit/f9d54384c797da89a17e89cde6e4002acaad3ced))
* **deps:** update dependency @apollo/client to v3.3.3 ([0662022](https://github.com/lowdefy/lowdefy/commit/0662022bd22f0ee001a42e913ed07201b1073cb7))
* **deps:** update dependency @apollo/client to v3.3.4 ([5b19621](https://github.com/lowdefy/lowdefy/commit/5b1962198a4d1b37de8486083d55322396891636))
* **deps:** update dependency graphql to v15.4.0 ([24803a3](https://github.com/lowdefy/lowdefy/commit/24803a30d4fe6fb140c28891691fc1fab6537d5f))
* **deps:** update react monorepo to v17.0.0-rc.3 ([7b1c3e9](https://github.com/lowdefy/lowdefy/commit/7b1c3e9479d267513fb1e6b0a0674e0b819bf4a6))
* **layout:** implement blockDefaultProps in renderer ([5d9b94e](https://github.com/lowdefy/lowdefy/commit/5d9b94e78429411e49db61bdd678b3ca628068fe))
* **render:** remove Defaults component import ([67aff08](https://github.com/lowdefy/lowdefy/commit/67aff08f725659807a5af26098efcc441116e6ce))
* **renderer:** add moduleFederation to meta in LoadBlock ([db25641](https://github.com/lowdefy/lowdefy/commit/db256419d5fef94df17936cfbc157fb6bb3eccd1))
* **renderer:** do not add block default props on lazy component ([bcbfc43](https://github.com/lowdefy/lowdefy/commit/bcbfc434634cb423c3eca42b6be4905bfdb9928f))
* **renderer:** do not pass Components prop to blocks ([88c811d](https://github.com/lowdefy/lowdefy/commit/88c811d8a940a822901c398415144ac44b2692a3))
* **renderer:** fix useContext, split onEnter and get context ([6af60c6](https://github.com/lowdefy/lowdefy/commit/6af60c6703f0fc119d0b44b6328a2ad1e8278ba6))
* memoize emotion and fix error boundry ([21dfcd2](https://github.com/lowdefy/lowdefy/commit/21dfcd24228e6e0383a98d0899dcb2864c805e85))
* update block-tools package version ([28212d2](https://github.com/lowdefy/lowdefy/commit/28212d2892355beaa46fe17535bbabdb61060547))
* update renderer and express to server local blocks ([ce638c7](https://github.com/lowdefy/lowdefy/commit/ce638c7d16700829db60e3b96dedc003fc21def9))
* use helpers from helpers ([ebe3738](https://github.com/lowdefy/lowdefy/commit/ebe373827d54f4009f5f246fef8be630e20ba4a7))
* **renderer, engine:** move displayMessage to rootContext, update engine tests ([0f6339f](https://github.com/lowdefy/lowdefy/commit/0f6339f07d0b00aa86cce8c501ebae7fd6157ea7))


### Features

* **blockTools:** bump version ([b450047](https://github.com/lowdefy/lowdefy/commit/b450047478ba55d93e233c839c77677c0114847a))
* **blockTools:** move module fed functions to blockTools ([5e6cebf](https://github.com/lowdefy/lowdefy/commit/5e6cebf6d0eaef1360ba1637e7135df52858fd16)), closes [#219](https://github.com/lowdefy/lowdefy/issues/219)
* **engine, renderer:** move apollo cache block update to renderer ([778ff4a](https://github.com/lowdefy/lowdefy/commit/778ff4aa99ce986b4ad43629cec9e3b82bde714f))
* **renderer:** add list prop for List block content ([4e1eccb](https://github.com/lowdefy/lowdefy/commit/4e1eccbd32c1423f5ab5d16191d437c0caf07530))
* **renderer:** add prefetchPages feature to pages ([ce547fc](https://github.com/lowdefy/lowdefy/commit/ce547fc348c2efe1218d22d29436bd4a9c226b91))
* **renderer:** add renderer rootcontext ([8b1da55](https://github.com/lowdefy/lowdefy/commit/8b1da55133274372eaa7bd8ec89f325823e77eac))
* **renderer:** make gql uri configurable ([9c054ee](https://github.com/lowdefy/lowdefy/commit/9c054eec10e9cc8e6ec58ec5a38f9b2d8a95dc44)), closes [#250](https://github.com/lowdefy/lowdefy/issues/250)
* **renderer:** make gql uri configurable using a prop, not global var ([3231d8f](https://github.com/lowdefy/lowdefy/commit/3231d8fa4f19aca6f6a81d937abaa8856338cac8))
* **renderer:** rename validate prop to validation ([e4153a6](https://github.com/lowdefy/lowdefy/commit/e4153a6eb83a238579a3b71ac9573b6d306f637a))
* **server-dev:** add @lowdefy/server-dev package ([58e36ab](https://github.com/lowdefy/lowdefy/commit/58e36ab3cb6e36ed6c2607dbe66259a51d2da3ef))
* configure render loading ([1f0064a](https://github.com/lowdefy/lowdefy/commit/1f0064ae979c6e05917dfc3655da05326ab3c010))
* remove fetch requests on page load, add async load actions ([1f396d6](https://github.com/lowdefy/lowdefy/commit/1f396d62ef204de1cde5ddeea0abe0bcf0c898c0))
* renderer first render 😱 ([a8b7f80](https://github.com/lowdefy/lowdefy/commit/a8b7f80659991821e6a13e2b77544a1e51a6797b))
* update webpack configs ([bcce3c8](https://github.com/lowdefy/lowdefy/commit/bcce3c85cea5857e429f1821785ffb939dcaa52a))
* **renderer:** page rendering, incomplete ([a91fadf](https://github.com/lowdefy/lowdefy/commit/a91fadf166f295e71b9f7781ab5a1192e3fa48af))
