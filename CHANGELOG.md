# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.3.0](https://github.com/BlackGlory/buffer-structures/compare/v0.2.0...v0.3.0) (2023-01-17)


### ⚠ BREAKING CHANGES

* Rewritten `HashSetView`, `HashMapView`
* `HashMap` now store keys
* **objects:** Replaced constructors with static create methods

### Features

* add `HashMapView` ([e6ea152](https://github.com/BlackGlory/buffer-structures/commit/e6ea152eb425c32335f3377034747ec104f086f4))
* add static `from` methods ([7080c40](https://github.com/BlackGlory/buffer-structures/commit/7080c40fbadf1427ce580a67cefddb6b73611a37))
* **hash-map:** add `keys`, `entries` methods ([d3c22c2](https://github.com/BlackGlory/buffer-structures/commit/d3c22c22f646d0220c0e4a74c5a21fe5dff05938))
* add `HashSetView` ([5875277](https://github.com/BlackGlory/buffer-structures/commit/58752772f87d819ce3662d531b71a3b5ceded4aa))
* store keys into `HashMap` ([299d8e5](https://github.com/BlackGlory/buffer-structures/commit/299d8e5bb11160f6c98bbbff2edf87e5213716a1))


* rewrite `HashSetView`, `HashMapView` ([ed184f0](https://github.com/BlackGlory/buffer-structures/commit/ed184f0de577f2a3794169606737df51872cce86))
* **objects:** replace constructors with static create methods ([7bd5e07](https://github.com/BlackGlory/buffer-structures/commit/7bd5e07799811009cb569e00651c561774d3b3f2))

## [0.2.0](https://github.com/BlackGlory/buffer-structures/compare/v0.1.2...v0.2.0) (2023-01-12)


### ⚠ BREAKING CHANGES

* Changed traits of `ReferenceCountedOwnershipPointerView`
* Changed traits of `LinkedList`, `LinkedListView`

* improve performance ([96ec469](https://github.com/BlackGlory/buffer-structures/commit/96ec469cc25ea3ed48c068786b2ae0ebf9aee3cf))
* improve performance ([28fec1e](https://github.com/BlackGlory/buffer-structures/commit/28fec1e48a40fce7f4b87f7ecd81466e500237f2))

### [0.1.2](https://github.com/BlackGlory/buffer-structures/compare/v0.1.1...v0.1.2) (2023-01-11)

### [0.1.1](https://github.com/BlackGlory/buffer-structures/compare/v0.1.0...v0.1.1) (2023-01-11)

## 0.1.0 (2023-01-11)


### Features

* **hash-set:** resize when overloaded ([cb32d33](https://github.com/BlackGlory/buffer-structures/commit/cb32d3333f678389d6d22f4363e98e1d97548696))
* add `Array`, `ArrayView` ([12ba6ec](https://github.com/BlackGlory/buffer-structures/commit/12ba6ec9ce6796f111ccc564ed0bc692e09b1063))
* add `freePointed`, `IOwnershipPointer` ([a70bff2](https://github.com/BlackGlory/buffer-structures/commit/a70bff2c9ef737f1e4b30e82e7799937a13c9175))
* add `getViewByIndex` ([b872f3e](https://github.com/BlackGlory/buffer-structures/commit/b872f3eb09f0e27ad4f9d85331b71cefc84b5374))
* add `getViewOfValue`, `getViewOfNext`, `deferNext` ([eb60d5a](https://github.com/BlackGlory/buffer-structures/commit/eb60d5a03ec1d227193134d9458c79be4482e990))
* add `HashMap` ([fcaee8a](https://github.com/BlackGlory/buffer-structures/commit/fcaee8aa6db6e309075a3a2256ebfd874a9a6e6e))
* add `options.growthFactor` ([314209a](https://github.com/BlackGlory/buffer-structures/commit/314209a6a33ab81273f3d041a3bc5cee4c83020b))
* **hash-map:** resize when overloaded ([7b3a98a](https://github.com/BlackGlory/buffer-structures/commit/7b3a98ac425ab8986078c7f0e6bfc0c77258acd7))
* add `getViewByKey`, `getViewByIndex` ([4eb9e7b](https://github.com/BlackGlory/buffer-structures/commit/4eb9e7b63a5c085f0fd7734ba9975229ba559732))
* add `HashSet` ([d16ee77](https://github.com/BlackGlory/buffer-structures/commit/d16ee775c34604018af54eda5dcab59ab588244b))
* add `IHash`, `IHasher`, `Hasher` ([d28547a](https://github.com/BlackGlory/buffer-structures/commit/d28547a28d736028d9993e4afcf4d3388b4dd95c))
* add `incrementCount`, `decrementCount` ([bcb489c](https://github.com/BlackGlory/buffer-structures/commit/bcb489ca1b911be6a5901a0d5a5cff473f096e2a))
* add `LinkedListView`, `LinkedList` ([fd18bb7](https://github.com/BlackGlory/buffer-structures/commit/fd18bb79ba6ca0c317e3bdaf2fb9952c64e933b4))
* add `OwnershipPointer`, `ReferenceCountedOwnershipPointer` ([1d70134](https://github.com/BlackGlory/buffer-structures/commit/1d70134ebe01b151a729d02cccabd14049278b16))
* add HashMap#size ([22f84c2](https://github.com/BlackGlory/buffer-structures/commit/22f84c2901eccb3c3c28823492e743fdab4d7de2))
* add literals ([5548b24](https://github.com/BlackGlory/buffer-structures/commit/5548b244698498542ff5dd46c064056f1a479559))
* add missing methods ([e538be4](https://github.com/BlackGlory/buffer-structures/commit/e538be4f0d8103404a2a9abaec4a8042079ece80))
* init ([e901d7d](https://github.com/BlackGlory/buffer-structures/commit/e901d7d077cd246b2774dfc0422963bc8e57306a))


### Bug Fixes

* hide #view ([e254ff8](https://github.com/BlackGlory/buffer-structures/commit/e254ff8a08796d839f1b843f867dcb674f10cb62))
* static methods ([82881c5](https://github.com/BlackGlory/buffer-structures/commit/82881c59d7788407ef8596eec116baa8056a774d))
