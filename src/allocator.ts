import { assert } from '@blackglory/prelude'
import { IAllocator } from '@src/types'
import { NonEmptyArray } from '@blackglory/prelude'

interface IMetadata {
  blocks: NonEmptyArray<IBlock>
}

interface IBlock {
  allocated: boolean
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
      blocks: [{ allocated: false, byteLength: buffer.byteLength - nullSize }]
    }
  ) {
    assert(buffer.byteLength >= nullSize, `The minimal byteLength of buffer is ${nullSize}`)
  }

  /**
   * @returns 字节单位的绝对偏移值
   */
  allocate(size: number): number {
    assert(Number.isInteger(size), 'The size should be an integer')
    assert(size > 0, 'The size should be greater than zero')

    for (const [byteOffset, block, index] of this.blocks()) {
      if (!block.allocated && block.byteLength >= size) {
        const oldByteLength = block.byteLength

        // 将当前块分配.
        block.allocated = true
        block.byteLength = size

        //  如果可分配主体长度超过用户请求的长度, 将多余的部分拆分成新块.
        const restByteLength = oldByteLength - size
        if (restByteLength > 0) {
          // 如果原本的下一个块是未分配的, 则将原本的下一个块和剩余空间合并成新块.
          const nextBlock = this.metadata.blocks[index + 1]
          if (nextBlock && !nextBlock.allocated) {
            nextBlock.byteLength += restByteLength
          } else {
            this.metadata.blocks.splice(index + 1, 0, {
              allocated: false
            , byteLength: restByteLength
            })
          }
        }

        return byteOffset
      }
    }

    throw new Error('Out of bounds')
  }

  /**
   * @param byteOffset 绝对偏移值
   */
  free(offset: number): void {
    for (const [byteOffset, block, index] of this.blocks()) {
      if (byteOffset === offset) {
        assert(block.allocated, 'The offset is not allocated')

        // 将当前块设置为未分配.
        block.allocated = false

        // 如果下一个块是未分配的, 则将下一个块合并进当前块.
        const nextBlock = this.metadata.blocks[index + 1]
        if (nextBlock && !nextBlock.allocated) {
          block.byteLength += nextBlock.byteLength

          this.metadata.blocks.splice(index + 1, 1)
        }

        // 如果上一个块是未分配的, 则将当前块合并进上一个块.
        const previousBlock = this.metadata.blocks[index - 1]
        if (previousBlock && !previousBlock.allocated) {
          previousBlock.byteLength += block.byteLength

          this.metadata.blocks.splice(index, 1)
        }

        return
      }
    }

    throw new Error('The offset is not allocated')
  }

  private * blocks(): IterableIterator<[byteOffset: number, block: IBlock, index: number]> {
    // 总是跳过第一个字节, 因为它的地址被视作指针的空值.
    let byteOffset: number = nullSize
    for (let i = 0; i < this.metadata.blocks.length; i++) {
      const block = this.metadata.blocks[i]
      yield [byteOffset, block, i]

      byteOffset += block.byteLength
    }
  }
}
