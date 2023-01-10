import { assert } from '@blackglory/prelude'
import { IAllocator } from '@src/interfaces'
import { NonEmptyArray } from '@blackglory/prelude'

interface IMetadata {
  freeLists: NonEmptyArray<IFreeList>
}

interface IFreeList {
  byteOffset: number
  byteLength: number
}

const nullSize = 1

/**
 * 分配器将元数据保存在缓冲区之外, 这是因为将元数据内置在缓冲区内时, 由于其固有的空间占用, 会更容易产生小的碎片.
 */
export class Allocator<T extends ArrayBufferLike> implements IAllocator {
  constructor(
    public readonly buffer: T
  , public readonly metadata: IMetadata = {
      freeLists: [
        {
          byteOffset: nullSize
        , byteLength: buffer.byteLength - nullSize
        }
      ]
    }
  ) {
    assert(buffer.byteLength >= nullSize, `The minimal byteLength of buffer is ${nullSize}`)
  }

  /**
   * 申请一段连续的缓冲区空间, 返回它的偏移值.
   * 在缓冲区空间不足以分配的情况下, 会抛出错误.
   * 
   * @returns 字节单位的偏移值
   */
  allocate(byteLength: number): number {
    assert(Number.isInteger(byteLength), 'The byteLength should be an integer')
    assert(byteLength > 0, 'The byteLength should be greater than zero')

    for (const [index, freeList] of this.freeLists()) {
      if (freeList.byteLength === byteLength) {
        // 如果空闲链表的长度等于用户请求的长度, 移除此空闲链表.
        this.metadata.freeLists.splice(index, 1)
        return freeList.byteOffset
      } else if (freeList.byteLength > byteLength) {
        // 如果空闲链表的长度超过用户请求的长度, 将多余的部分拆分成新的空闲链表.
        const oldFreeListByteOffset = freeList.byteOffset
        freeList.byteOffset += byteLength
        freeList.byteLength -= byteLength
        return oldFreeListByteOffset
      }
    }

    throw new Error('Out of bounds')
  }

  /**
   * 释放一段已申请的连续内存空间.
   */
  free(byteOffset: number, byteLength: number): void {
    assert(Number.isInteger(byteOffset), 'The byteOffset should be an integer')
    assert(Number.isInteger(byteLength), 'The byteLength should be an integer')
    assert(
      byteOffset >= nullSize
    , `The byteOffset should be greater than or equal to ${nullSize}`
    )
    assert(byteLength > 0, 'The byteLength should be greater than zero')
    assert(
      byteOffset + byteLength <= this.buffer.byteLength
    , 'The byteOffsset + byteLength should be less than or equal to buffer.byteLength'
    )

    if (this.metadata.freeLists.length === 0) {
      // 创建一个新的空闲链表.
      const newFreeList: IFreeList = {
        byteOffset
      , byteLength
      }
      this.metadata.freeLists.push(newFreeList)
      return
    } else {
      let previousFreeList: IFreeList | undefined = undefined
      for (const [index, nextFreeList] of this.freeLists()) {
        if (
          (
            byteOffset >= nextFreeList.byteOffset &&
            byteOffset < nextFreeList.byteOffset + nextFreeList.byteLength
          ) || (
            byteOffset + byteLength > nextFreeList.byteOffset &&
            byteOffset + byteLength <= nextFreeList.byteOffset + nextFreeList.byteLength
          )
        ) {
          throw new Error('The offset is not allocated')
        } else if (nextFreeList.byteOffset > byteOffset) {
          // 如果nextFreeListbyteOffset大于用户提交的offset,
          // 说明需要被释放的区域位于previousFreeList和nextFreeList之间.

          // 创建一个新的空闲链表.
          const newFreeList: IFreeList = {
            byteOffset
          , byteLength
          }
          this.metadata.freeLists.splice(index, 0, newFreeList)

          // 如果下一个空闲链表刚好接上新的空闲链表, 合并两个链表.
          if (newFreeList.byteOffset + newFreeList.byteLength === nextFreeList.byteOffset) {
            newFreeList.byteLength += nextFreeList.byteLength
            this.metadata.freeLists.splice(index, 2, newFreeList)
          }

          // 如果上一个空闲链表刚好接上新的空闲链表, 合并两个链表.
          if (
            previousFreeList &&
            previousFreeList.byteOffset + previousFreeList.byteLength === newFreeList.byteOffset
          ) {
            previousFreeList.byteLength += newFreeList.byteLength
            this.metadata.freeLists.splice(index, 1)
          }

          return
        } else {
          previousFreeList = nextFreeList
        }
      }

      // 如果代码运行到此处, 说明释放的区域比最后一个空闲链表还要靠后.
      // 创建一个新的空闲链表.
      const newFreeList: IFreeList = {
        byteOffset
      , byteLength
      }
      this.metadata.freeLists.push(newFreeList)

      // 如果上一个空闲链表刚好接上新的空闲链表, 合并两个链表.
      if (
        previousFreeList!.byteOffset + previousFreeList!.byteLength === newFreeList.byteOffset
      ) {
        previousFreeList!.byteLength += newFreeList.byteLength
        this.metadata.freeLists.pop()
      }
      return
    }
  }

  private freeLists(): IterableIterator<[index: number, freeBlock: IFreeList]> {
    return this.metadata.freeLists.entries()
  }
}
