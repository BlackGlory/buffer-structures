# buffer-structures
JavaScript中的低级数据结构, 数据存储在基于ArrayBuffer的线性内存里.

## 动机
JavaScript跨上下文的数据传输严重依赖于序列化和复制, 这直接成为了多线程程序的性能瓶颈.
实现更快的数据传输意味着避免复制和序列化, [transferable objects]和`SharedArrayBuffer`让开发人员接近做到这一点.
但要达到我们的目标仍然困难重重, 因为能够使用的数据类型极为有限, 几乎绕不开`ArrayBuffer`,
这意味着我们最终会需要在`ArrayBuffer`之上建立低级的数据结构.
事实证明这很难, 有点像重新发明C语言.

市面上已经有一些可以满足类似需求的库, 但这些库普遍避免去实现缓冲区分配器(相当于用于缓冲区的内存分配器).
缓冲区分配器的缺乏使得一些数据结构不可能实现, 例如使用率最高的HashMap, 所以我最终只能创建自己的库.

[transferable objects]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects

## 已知问题
### 性能问题
微基准测试的结果表明, 此库的性能表现不及预期, 在大多数情况下, 你都不应该使用此库.
例如, 此库提供的HashMap比原生Map慢几个数量级, 任何大量访问HashMap的项目都会因此出现严重的性能问题.

经过调查, 基本可以确定性能瓶颈在于语言本身, 这意味着很难在不严重损害代码可读性(以利用JIT优化)的前提下提升性能.
一种想法是通过WASM或本机插件实现此库, 但这么做其实不如直接用其他语言完成多线程任务.

## 常见问题
### 与类型化数组的区别是什么?
此库中的数据结构将缓冲区视作一种可分配和释放的线性内存来使用.
在这种设计下, 数十万个数据结构可以共享同一个缓冲区, 而不是独占缓冲区.
共享缓冲区的事实允许了指针的存在, 让链表和节点这样的数据结构能够被实现.

### 数据结构是跨平台的吗?
此库提供的数据结构是语言无关的, 理论上只要一个语言能够支持定长的字节数组, 就可以将该库移植过去.

值得一提的是, 为了实现其中一些对象, 语言本身最好能支持多态, 否则用户体验可能会很差.

### 为什么不用`FinalizationRegistry`实现垃圾回收?
`FinalizationRegistry`是一个可以用来模拟类似[RAII]的自动析构行为的API.
对于此库中的数据结构来说, 如果缓冲区空间也能够随着运行时的垃圾回收而自动被释放, 会很酷.

遗憾的是, 目前的`FinalizatinRegistry`规范不包含任何有用的强制性承诺,
这导致相关缓冲区可能会太迟释放, 甚至根本不释放, 这种不确定性是不可接受的.

[RAII]: https://en.wikipedia.org/wiki/Resource_acquisition_is_initialization

## Install
```sh
npm install --save buffer-structures
# or
yarn add buffer-structures
```

## API
### 缓冲区分配器 IAllocator
```ts
interface IAllocator {
  readonly buffer: ArrayBufferLike

  /**
   * @returns 字节单位的绝对偏移值
   */
  allocate(byteLength: number): number

  free(byteOffset: number, byteLength: number): void
}
```

#### Allocator
面向字节的缓冲区分配器, 总是使用整个缓冲区.
该缓冲区分配器的功能非常基础, 采用First-Fit策略, 没有任何花哨功能.

```ts
class Allocator<T extends ArrayBufferLike> implements IAllocator {
  readonly buffer: T
  readonly metadata: IMetadata

  constructor(buffer: T, metadata?: IMetadata)

  /**
   * 申请一段连续的缓冲区空间, 返回它的偏移值.
   * 在缓冲区空间不足以分配的情况下, 会抛出错误.
   */
  allocate(byteLength: number): number

  /**
   * 释放一段已申请的连续内存空间.
   */
  free(byteOffset: number, byteLength: number): void
}
```

### 特型 Trait
一系列TypeScript接口, 类似于Rust的特型, 用于表明一个对象支持哪些功能.

```ts
interface ISized {
  readonly byteLength: number
}

interface IReference {
  readonly byteOffset: number
}

interface IReadable<T> {
  get(): T
}

interface IWritable<T> {
  set(value: T): void
}

interface IReadableWritable<T> extends IReadable<T>, IWritable<T> {}

interface IHash {
  hash(hasher: IHasher): void
}

interface IDestroy {
  destroy(): void
}

interface IFree {
  /**
   * 释放该视图相关的数据.
   * 
   * 如果视图拥有其他数据的所有权, 则调用该函数时应能实现级联释放.
   */
  free(allocator: IAllocator): void
}

interface IOwnershipPointer {
  /**
   * 释放指向的数据.
   */
  freePointed(allocator: IAllocator): void
}

interface IClone<T> {
  clone(): T
}

interface ICopy<T> {
  copy(): T
}
```

### 字面量 Literal
字面量是一种内存数据结构, 它以JavaScript数据类型表示, 不需要缓冲区就可以使用.
所有字面量都是不可变的, 以免不慎将其当作视图或对象使用.

#### Float32Literal
```ts
function float32(val: number): Float32Literal

class Float32Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Float64Literal
```ts
function float64(val: number): Float64Literal

class Float64Literal extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Int8Literal
```ts
function int8(val: number): Int8Literal

class Int8Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Int16Literal
```ts
function int16(val: number): Int16Literal

class Int16Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Int32Literal
```ts
function int32(val: number): Int32Literal

class Int32Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Uint8Literal
```ts
function uint8(val: number): Uint8Literal

class Uint8Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Uint16Literal
```ts
function uint16(val: number): Uint16Literal

class Uint16Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### Uint32Literal
```ts
function uint32(val: number): Uint32Literal

class Uint32Literal
extends BaseLiteral
implements IReadable<number>
         , IHash {
  constructor(value: number)
}
```

#### StringLiteral
```ts
function string(val: string): StringLiteral

class StringLiteral
extends BaseLiteral
implements IReadable<string>
         , IHash {
  constructor(value: string)
}
```

### 对象 Object
对象是JavaScript侧拥有数据所有权的引用计数智能指针, 用于申请、释放、读写缓冲区数据结构.
智能指针由JavaScript管理, 指针指向的数据位于缓冲区.
一旦对象丢失, 则缓冲区相关数据的数据结构信息和所有权都会一并遗失.
在抛弃对象时, 需要手动执行`destroy`方法来释放缓冲区数据.

#### Float32
```ts
class Float32
extends BaseObject
implements ICopy<Float32>
         , IClone<Float32>
         , IReadableWritable<Float32Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Float32
  static from(allocator: IAllocator, byteOffset: number): Float32
}
```

#### Float64
```ts
class Float64
extends BaseObject
implements ICopy<Float64>
         , IClone<Float64>
         , IReadableWritable<Float64Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Float64
  static from(allocator: IAllocator, byteOffset: number): Float64
}
```

#### Int8
```ts
class Int8
extends BaseObject
implements ICopy<Int8>
         , IClone<Int8>
         , IReadableWritable<Int8Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Int8
  static from(allocator: IAllocator, byteOffset: number): Int8
}
```

#### Int16
```ts
class Int16
extends BaseObject
implements ICopy<Int16>
         , IClone<Int16>
         , IReadableWritable<Int16Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Int16
  static from(allocator: IAllocator, byteOffset: number): Int16
}
```

#### Int32
```ts
class Int32
extends BaseObject
implements ICopy<Int32>
         , IClone<Int32>
         , IReadableWritable<Int32Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Int32
  static from(allocator: IAllocator, byteOffset: number): Int32
}
```

#### Uint8
```ts
class Uint8
extends BaseObject
implements ICopy<Uint8>
         , IClone<Uint8>
         , IReadableWritable<Uint8Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Uint8
  static from(allocator: IAllocator, byteOffset: number): Uint8
}
```

#### Uint16
```ts
class Uint16
extends BaseObject
implements ICopy<Uint16>
         , IClone<Uint16>
         , IReadableWritable<Uint16Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Uint16
  static from(allocator: IAllocator, byteOffset: number): Uint16
}
```

#### Uint32
```ts
class Uint32
extends BaseObject
implements ICopy<Uint32>
         , IClone<Uint32>
         , IReadableWritable<Uint32Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: number): Uint32
  static from(allocator: IAllocator, byteOffset: number): Uint32
}
```

#### String
```ts
class String
extends BaseObject
implements ICopy<String>
         , IClone<String>
         , IReadable<StrintLiteral>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: string): String
  static from(allocator: IAllocator, byteOffset: number): String
}
```

#### OwnershipPointer
```ts
class OwnershipPointer<View extends BaseView & IHash & IFree>
extends BaseObject
implements IClone<OwnershipPointer<View>>
         , IHash
         , IDestroy
         , IReference {
  static create<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  ): OwnershipPointer<View>
  static from<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ): OwnershipPointer<View>

  readonly viewConstructor: ViewConstructor<View>

  deref(): View | null
}
```

#### ReferenceCountedOwnershipPointer
```ts
class ReferenceCountedOwnershipPointer<View extends BaseView & IHash & IFree>
extends BaseObject
implements IClone<ReferenceCountedOwnershipPointer<View>>
         , IHash
         , IDestroy
         , IReference {
  static create<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , valueByteOffset: number
  ): ReferenceCountedOwnershipPointer<View>
  static from<View extends BaseView & IHash & IFree>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ): ReferenceCountedOwnershipPointer<View>

  readonly viewConstructor: ViewConstructor<View>

  deref(): View | null
}
```

#### LinkedList
```ts
class LinkedList<View extends BaseView & IHash & IReadableWritable<unknown>>
extends BaseObject
implements ICopy<LinkedList<View>>
         , IClone<LinkedList<View>>
         , IReadableWritable<MapStructureToTupleValue<LinkedListStructure<View>>>
         , IHash
         , IDestroy
         , IReference {
  static create<View extends BaseView & IHash & IReadableWritable<unknown>>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , value: MapStructureToTupleValue<LinkedListStructure<View>>
  ): LinkedList<View>
  static from<View extends BaseView & IHash & IReadableWritable<unknown>>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ): LinkedList<View>

  readonly viewConstructor: ViewConstructor<View>

  setNext(value: MapStructureToTupleValue<LinkedListStructure<View>>['next']): void
  getNext(): MapStructureToTupleValue<LinkedListStructure<View>>['next']
  getViewOfNext(): OwnershipPointerView<LinkedListStructure<View>>
  derefNext(): LinkedListView<View> | null

  setValue(value: MapStructureToTupleValue<LinkedListStructure<View>>['value']): void
  getValue(): MapStructureToTupleValue<LinkedListStructure<View>>['value']
  getViewOfValue(): View
}
```

#### Array
```ts
class Array<
  View extends BaseView & IReadableWritable<unknown> & IHash
, Length extends number
>
extends BaseObject
implements ICopy<Array<View, Length>>
         , IClone<Array<View, Length>>
         , IHash
         , IDestroy
         , IReference {
  static create<
    View extends BaseView & IReadableWritable<unknown> & IHash
  , Length extends number
  >(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , length: Length
  , values?: FixedLengthArray<UnpackedReadableWritable<View>, Length>
  ): Array<View, Length>

  static from<
    View extends BaseView & IReadableWritable<unknown> & IHash
  , Length extends number
  >(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , length: Length
  ): Array<View, Length>

  get length: number
  readonly viewConstructor: ViewConstructor<View>

  getByIndex(index: number): UnpackedReadableWritable<View>
  setByIndex(index: number, value: UnpackedReadableWritable<View>): void
  getViewByIndex(index: number): View
}
```

#### Tuple
```ts
class Tuple<
  Structure extends NonEmptyArray<
    ViewConstructor<IReadableWritable<unknown> & IHash>
  >
>
extends BaseObject
implements ICopy<Tuple<Structure>>
         , IClone<Tuple<Structure>>
         , IReadableWritable<MapStructureToTupleValue<Structure>>
         , IHash
         , IDestroy
         , IReference {
  static create<
    Structure extends NonEmptyArray<
      ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , structure: Structure
  , value: MapStructureToTupleValue<Structure>
  ): Tuple<Structure>

  static from<
    Structure extends NonEmptyArray<
      ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , structure: Structure
  , byteOffset: number
  ): Tuple<Structure>

  readonly structure: Structure

  getByIndex<U extends number & keyof Structure>(
    index: U
  ): MapStructureToTupleValue<Structure>[U]

  setByIndex<U extends number & keyof Structure>(
    index: U
  , value: MapStructureToTupleValue<Structure>[U]
  ): void

  getViewByIndex<U extends number & keyof Structure>(
    index: U
  ): ReturnTypeOfConstructor<Structure[U]>
}
```

#### Struct
```ts
class Struct<
  Structure extends Record<
    string
  , ViewConstructor<IReadableWritable<unknown> & IHash>
  >
>
extends BaseObject
implements ICopy<Struct<Structure>>
         , IClone<Struct<Structure>>
         , IReadableWritable<MapStructureToStructValue<Structure>>
         , IHash
         , IDestroy
         , IReference {
  static create<
    Structure extends Record<
      string
    , ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , structure: Structure
  , value: MapStructureToStructValue<Structure>
  ): Struct<Structure>

  static from<
    Structure extends Record<
      string
    , ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , byteOffset: number
  , structure: Structure
  ): Struct<Structure>

  readonly structure: Structure

  getByKey<U extends string & keyof Structure>(
    key: U
  ): MapStructureToStructValue<Structure>[U]
  setByKey<U extends string & keyof Structure>(
    key: U
  , value: MapStructureToStructValue<Structure>[U]
  ): void
  getViewByKey<U extends string & keyof Structure>(
    key: U
  ): ReturnTypeOfConstructor<Structure[U]>
}
```

#### HashMap
```ts
/**
 * 在向HashMap添加新的项目后, HashMap可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
class HashMap<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>
extends BaseObject
implements IClone<HashMap<KeyView, ValueView>>
         , IDestroy
         , IReference {
  static create<
    KeyView extends BaseView & IReadableWritable<unknown> & IHash
  , ValueView extends BaseView & IReadableWritable<unknown> & IHash
  >(
    allocator: IAllocator
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  ): HashMap<KeyView, ValueView>

  static from<
    KeyView extends BaseView & IReadableWritable<unknown> & IHash
  , ValueView extends BaseView & IReadableWritable<unknown> & IHash
  >(
    allocator: IAllocator
  , byteOffset: number
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  ): HashMap<KeyView, ValueView>

  readonly keyViewConstructor: ViewConstructor<KeyView>
  readonly valueViewConstructor: ViewConstructor<ValueView>

  get capacity(): number
  get loadFactor(): number
  get growthFactor(): number
  get size(): number

  destroy(): void
  clone(): HashMap<KeyView, ValueView>

  entries(): IterableIterator<[KeyView, ValueView]>
  keys(): IterableIterator<KeyView>
  values(): IterableIterator<ValueView>

  has(key: IHash): boolean
  get(key: IHash): ValueView | null
  set(
    key: IHash & UnpackedReadableWritable<KeyView>
  , value: UnpackedReadableWritable<ValueView>
  ): void
  delete(key: IHash): void
}
```

#### HashSet
```ts
/**
 * 在向HashSet添加新的项目后, HashSet可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
class HashSet<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseObject
implements IClone<HashSet<View>>
         , IDestroy
         , IReference {
  static create<View extends BaseView & IReadableWritable<unknown> & IHash>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  ): HashSet<View>

  static from<View extends BaseView & IReadableWritable<unknown> & IHash>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  ): HashSet<View>

  readonly viewConstructor: ViewConstructor<View>

  get byteOffset(): number
  get capacity(): number
  get loadFactor(): number
  get growthFactor(): number
  get size(): number

  values(): IterableIterator<View>
  has(value: IHash): boolean
  add(value: UnpackedReadableWritable<View> & IHash): void
  delete(value: IHash): void
}
```

### 视图 View
视图是用于读写缓冲区数据结构的低级API.
由于视图对相关数据的生命周期一无所知, 使用视图总是会有一定风险.

#### Float32View
在缓冲区的表示:
```ts
type Float32 = [float32]
```

```ts
class Float32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Float32Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Float64View
在缓冲区的表示:
```ts
type Float64 = [float64]
```

```ts
class Float64View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Float64Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Int8View
在缓冲区的表示:
```ts
type Int8 = [int8]
```

```ts
class Int8View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Int8Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Int16View
在缓冲区的表示:
```ts
type Int16 = [int16]
```

```ts
class Int16View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Int16Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Int32View
在缓冲区的表示:
```ts
type Int32 = [int32]
```

```ts
class Int32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Int32Literal> {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Uint8View
在缓冲区的表示:
```ts
type Uint8 = [uint8]
```

```ts
class Uint8View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint8Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Uint16View
在缓冲区的表示:
```ts
type Uint16 = [uint16]
```

```ts
class Uint16View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint16Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### Uint32View
在缓冲区的表示:
```ts
type Uint32 = [uint32]
```

```ts
class Uint32View
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint32Literal>
         , IFree {
  static readonly byteLength: number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### StringView
缓冲区中的UTF-8编码的字符串数据的视图.
值得一提的是, 由于字符串的长度不固定, 因此在大多数情况下, 比起直接使用字符串, 会更倾向于使用字符串的指针.

在缓冲区的表示:
```ts
type String = [byteLength: uint32, ...bytes: uint8[]]
```

```ts
class StringView
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<StringLiteral>
         , ISized
         , IFree {
  static getByteLength(value: string): number

  get byteLength(): number

  constructor(buffer: ArrayBufferLike, byteOffset: number)
}
```

#### PointerView
缓冲区中的指针视图, 相当于由编程语言支持的指针.
指针要么指向缓冲区中的某个偏移值, 要么指向代表null的`0`.

指针视图具有传统指针具有的所有典型问题, 例如指针可能会悬空.

在缓冲区的表示:
```ts
type Pointer = [uint32]
```

```ts
type ViewConstructor<View extends BaseView> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

class PointerView<View extends BaseView & IHash>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint32Literal | null>
         , IFree {
  static readonly byteLength: number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstruct: ViewConstructor<View>
  )

  deref(): View | null
}
```

#### OwnershipPointerView
缓冲区中的指针视图, 具有其指向数据的所有权.
与`PointerView`的区别在于, 当`OwnershipPointerView`被释放时, 其指向的数据结构也会被释放.
这种级联释放的特性在其作为`StructView`, `TupleView`, `ArrayView`的泛型的一部分时, 也会生效.

在缓冲区的表示:
```ts
type OwnershipPointer = [uint32]
```

```ts
type ViewConstructor<View extends BaseView> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

class OwnershipPointerView<View extends BaseView & IHash & IFree>
extends PointerView<View>
implements IHash
         , IReference
         , IReadableWritable<Uint32Literal | null>
         , IFree
         , IOwnershipPointer {
  static readonly byteLength: number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstruct: ViewConstructor<View>
  )

  deref(): View | null
}
```

#### ReferenceCountedOwnershipPointerView
缓冲区中的指针视图, 具有其指向数据的所有权, 附带有初始值为1的引用计数.
与`OwnershipPointerView`的区别在于,
当`ReferenceCountedOwnershipPointerView`被释放时, 会以计数自减1替代释放,
直到计数因为此次自减而归零才会真正释放.

在缓冲区的表示:
```ts
type ReferenceCountedOwnershipPointer = [count: uint32, value: OwnershipPointerView]
```

```ts
type OwnershipPointerViewConstructor<View extends BaseView & IHash & IFree> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => OwnershipPointerView<View>)

class ReferenceCountedOwnershipPointerView<View extends BaseView & IHash & IFree>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<[count: Uint32Literal, value: Uint32Literal | null]>
         , IFree
         , IOwnershipPointer {
  static readonly byteLength: number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  )

  setValue(value: Uint32Literal | null): void 
  getValue(): Uint32Literal | null

  setCount(value: Uint32Literal): void
  getCount(): Uint32Literal
  incrementCount(value: Uint32Literal = uint32(1)): void
  decrementCount(value: Uint32Literal = uint32(1)): void

  deref(): View | null
}
```

#### LinkedListView
缓冲区中的链表视图.

在缓冲区的表示:
```ts
type LinkedList = [next: OwnershipPointerView, value: View]
```

```ts
type ViewConstructor<View extends BaseView> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type OwnershipPointerViewConstructor<View extends BaseView & IHash & IFree> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => OwnershipPointerView<View>)

type LinkedListStructure<View extends BaseView & IHash & IReadableWritable<unknown>> = [
  next: OwnershipPointerViewConstructor<LinkedListView<View>>
, value: ViewConstructor<View>
]

class LinkedListView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<MapStructureToTupleValue<LinkedListStructure<View>>>
         , ISized
         , IFree {
  static getByteLength(
    viewConstructor: ViewConstructor<
      BaseView
    & IReadableWritable<unknown>
    & IHash
    >
  ): number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  )

  setNext(value: MapStructureToTupleValue<LinkedListStructure<View>>['next']): void
  getNext(): MapStructureToTupleValue<LinkedListStructure<View>>['next']
  getViewOfNext(): OwnershipPointerView<LinkedListView<View>>
  derefNext(): LinkedListView<View> | null

  setValue(value: MapStructureToTupleValue<LinkedListStructure<View>>['value']): void
  getValue(): MapStructureToTupleValue<LinkedListStructure<View>>['value']
  getViewOfValue(): View
}
```

#### ArrayView
缓冲区中的定长数组视图.

在缓冲区中的表示:
```ts
type Array<N> = T[N]
```

```ts
type ViewConstructor<View extends BaseView> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

class ArrayView<
  View extends BaseView & IReadableWritable<unknown> & IHash
, Length extends number
>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<FixedLengthArray<UnpackedReadableWritable<View>, Length>>
         , ISized
         , IFree {
  static getByteLength(viewConstructor: ViewConstructor<BaseView>, length: number): number

  readonly length: Length

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , length: Length
  )

  getByIndex(index: number): UnpackedReadableWritable<View>
  setByIndex(index: number, value: UnpackedReadableWritable<View>): void
  getViewByIndex(index: number): View
}
```

#### TupleView
缓冲区中的元组视图, 与`StructView`相当但接口不同.

在缓冲区中的表示:
```ts
type Tuple = [Propety1, Property2, ..., PropertyN]
```

```ts
type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type MapStructureToTupleValue<
  T extends NonEmptyArray<ViewConstructor<IReadableWritable<unknown> & IHash>>
> = {
  [Index in keyof T]: UnpackedReadableWritable<ReturnTypeOfConstructor<T[Index]>>
}

class TupleView<
  Structure extends NonEmptyArray<ViewConstructor<IReadableWritable<unknown> & IHash>>
>
extends BaseView
implements IReference
         , IReadableWritable<MapStructureToTupleValue<Structure>>
         , ISized
         , IHash
         , IFree {
  static getByteLength(structure: NonEmptyArray<ViewConstructor<unknown>>): number

  constructor(buffer: ArrayBufferLike, byteOffset: number, structure: Structure)

  getByIndex<U extends number & keyof Structure>(
    index: U
  ): MapStructureToTupleValue<Structure>[U]
  setByIndex<U extends number & keyof Structure>(
    index: U
  , value: MapStructureToTupleValue<Structure>[U]
  ): void
  getViewByIndex<U extends number & keyof Structure>(
    index: U
  ): ReturnTypeOfConstructor<Structure[U]>
}
```

#### StructView
缓冲区中的结构体视图, 与`TupleView`相当但接口不同.
大部分情况下, `StructView`的可读性更好, 但出于性能原因, 你可能更想要使用`TupleView`而不是`StructView`.

在缓冲区中的表示:
```ts
type Struct = [Propety1, Property2, ..., PropertyN]
```

```ts
type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type MapStructureToStructValue<
  Structure extends Record<
    string
  , ViewConstructor<IReadableWritable<unknown> & IHash>
  >
> = {
  [Key in keyof Structure]: UnpackedReadableWritable<
    ReturnTypeOfConstructor<Structure[Key]>
  >
}

class StructView<
  Structure extends Record<string, ViewConstructor<IReadableWritable<unknown> & IHash>>
>
extends BaseView
implements IReference
         , IReadableWritable<MapStructureToStructValue<Structure>>
         , ISized
         , IHash
         , IFree {
  static getByteLength(structure: Record<string, ViewConstructor<unknown>>): number

  constructor(buffer: ArrayBufferLike, byteOffset: number, structure: Structure)

  getByKey<U extends string & keyof Structure>(key: U): MapStructureToStructValue<Structure>[U]
  setByKey<U extends string & keyof Structure>(
    key: U
  , value: MapStructureToStructValue<Structure>[U]
  ): void
  getViewByKey<U extends string & keyof Structure>(
    key: U
  ): ReturnTypeOfConstructor<Structure[U]>
}
```

#### HashSetView
```ts
type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type HashSetStructure<View extends BaseView & IReadableWritable<unknown> & IHash> = [
  size: typeof Uint32View
, buckets: ViewConstructor<IInternalBucketsOwnershipPointerView<View>>
]

/**
 * 在向HashSet添加新的项目后, HashSet可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
class HashSetView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IReference
         , IFree {
  get capacity(): number
  readonly loadFactor: number
  readonly growthFactor: number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  )

  set(value: MapStructureToTupleValue<HashSetStructure<View>>): void
  get(): MapStructureToTupleValue<HashSetStructure<View>>
  setSize(value: Uint32Literal): void
  getSize(): number
  setBuckets(value: Uint32Literal): void
  derefBuckets(): HashBucketsView<View> | null

  itemValues(): IterableIterator<View>

  hasItem(value: IHash): boolean
  addItem(allocator: IAllocator, value: UnpackedReadableWritable<View> & IHash): void
  deleteItem(allocator: IAllocator, value: IHash): void
}
```

#### HashMapView
```ts
type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type HashMapStructure<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = [
  size: typeof Uint32View
, buckets: ViewConstructor<IInternalBucketsOwnershipPointerView<KeyView, ValueView>>
]

/**
 * 在向HashMap添加新的项目后, HashMap可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
class HashMapView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>
extends BaseView
implements IReference
         , IFree {
  get capacity(): number
  readonly loadFactor: number
  readonly growthFactor: number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , keyViewConstructor: ViewConstructor<KeyView>
  , valueViewConstructor: ViewConstructor<ValueView>
  , options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  )

  set(value: MapStructureToTupleValue<HashMapStructure<KeyView, ValueView>>): void
  get(): MapStructureToTupleValue<HashMapStructure<KeyView, ValueView>>
  setSize(value: Uint32Literal): void
  getSize(): number
  setBuckets(value: Uint32Literal): void
  derefBuckets(): HashBucketsView<IInternalTupleView<KeyView, ValueView>> | null

  itemEntries(): IterableIterator<[KeyView, ValueView]>
  itemKeys(): IterableIterator<KeyView>
  itemValues(): IterableIterator<ValueView>

  hasItem(key: IHash): boolean
  getItem(key: IHash): ValueView | null
  setItem(
    allocator: IAllocator
  , key: IHash & UnpackedReadableWritable<KeyView>
  , value: UnpackedReadableWritable<ValueView>
  ): void
  deleteItem(allocator: IAllocator, key: IHash): void
}
```

#### HashBucketsView
```ts
class HashBucketsView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IReference
         , IFree
         , ISized {
  static getByteLength<View extends BaseView & IReadableWritable<unknown> & IHash>(
    viewConstructor: ViewConstructor<View>
  , capacity: number
  )

  readonly capacity: number

  constructor(
    buffer: ArrayBufferLike
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , capacity: number
  )

  free(allocator: IAllocator): void

  getByIndex(
    index: number
  ): UnpackedReadableWritable<IInternalLinkedListOwnershipPointerView<View>>
  setByIndex(
    index: number
  , value: UnpackedReadableWritable<IInternalLinkedListOwnershipPointerView<View>>
  ): void
  getViewByIndex(index: number): IInternalLinkedListOwnershipPointerView<View>

  itemValues(): IterableIterator<View>

  hasItem(hash: number): boolean
  getItem(hash: number): View | null

  /**
   * @returns 是否插入了项目.
   */
  addItem(
    allocator: IAllocator
  , hash: number
  , value: UnpackedReadableWritable<View>
  ): boolean

  /**
   * @returns 是否删除了项目.
   */
  deleteItem(allocator: IAllocator, hash: number): boolean

  transfer(newBuckets: HashBucketsView<View>): void
}
```
