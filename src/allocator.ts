import { assert } from '@blackglory/prelude'
import { IAllocator } from '@src/types'

/**
 * # 格式
 * 缓冲区由被称作块的基本元素组成, 每个块分为头部(header)和主体(body).
 * 块具有"已分配"和"未分配"两种状态, 两种状态可以互相转换.
 * 不存在连续的"未分配"块, 因为这样的块会被合并成一个块.
 * 可接受的最小缓冲区需要能够容纳8个字节的数据, 因为这是创建首个块的最低需求.
 * 
 * ## 头部
 * 储存块的元数据, 固定为8个字节长度.
 * 头部的第一个元素是u32类型的"下一个块"相对于分配器可访问的第一个字节的地址.
 * 需要注意的是, "下一个块"可能并不真的存在, 出现这种情况有两种可能:
 * 1. 缓冲区用尽, 最后一个块刚好用完尾部的所有空间.
 *    最简单的例子是刚刚初始化好的缓冲区, 只有一个块, 该块是"未分配"的, "下一个块"直接指向缓冲区外.
 * 2. 缓冲区尾部的剩余空间不能完整容纳"下一个块的头部"加上"一个未分配字节".
 *    仅能容纳"下一个块的头部"的剩余空间是无用的, 因为对这样的块来说没有任何空间可以被分配.
 * 头部的第二个元素是u32类型的已分配内容长度, 如果未分配, 记为0.
 * 
 * ## 主体
 * 交由用户使用的空间, 其长度等于分配给用户的大小.
 * 用户调用`allocate`方法后会获得址主体的第一个字节的偏移值作为地址.
 */
export class Allocator<T extends ArrayBufferLike> implements IAllocator {
  static readonly headerByteLength = Uint32Array.BYTES_PER_ELEMENT * 2
  private view: DataView

  constructor(
    public readonly buffer: T
  , public readonly byteOffset: number = 0
  , public readonly byteLength: number = buffer.byteLength - byteOffset
  ) {
    assert(byteLength >= Allocator.headerByteLength, 'The buffer is too small to initialize.')

    this.view = new DataView(buffer, byteOffset, byteLength)
    if (allZeros(this.view)) {
      // 如果待分配区域全是零值, 则格式化它, 创建第一个块.
      this.setBlockHeader(0, [this.view.byteLength, 0])
    } else {
      // 如果待分配区域并非全是零值, 则检查它是否是一个合法的缓冲区.
      assert(
        this.validateBufferFormat()
      , 'The format of the specified area of the buffer is invalid, please reset the specified area to zero.'
      )
    }
  }

  /**
   * @returns 字节单位的绝对偏移值
   */
  allocate(size: number): number {
    return this.byteOffset + this._allocate(size)
  }

  private _allocate(size: number): number {
    assert(Number.isInteger(size), 'The size should be an integer')
    assert(size > 0, 'The size should be greater than zero')

    let blockOffset = 0
    while (blockOffset + Allocator.headerByteLength < this.byteLength) {
      const [nextBlock, bodyLength] = this.getBlockHeader(blockOffset)
      if (bodyLength === 0) {
        const bodyOffset = blockOffset + Allocator.headerByteLength
        const allocatableBodyLength = nextBlock <= this.byteLength
                                    ? nextBlock - bodyOffset
                                    : 0
        if (allocatableBodyLength >= size) {
          // 将当前块分配.
          const oldNextBlock = nextBlock
          const newNextBlock = bodyOffset + size
          this.setBlockHeader(blockOffset, [newNextBlock, size])

          // 可分配主体长度超过用户请求的长度, 将多余的部分拆分成新块.
          if (allocatableBodyLength > size) {
            // 只在下一个块的头没有超出缓冲区范围时, 才创建新块.
            if (newNextBlock + Allocator.headerByteLength < this.byteLength) {
              // 创建新块.
              this.setBlockHeader(newNextBlock, [oldNextBlock, 0])

              if (oldNextBlock + Allocator.headerByteLength < this.byteLength) {
                const [
                  oldNextBlockNextBlock
                , oldNextBlockBodyLength
                ] = this.getBlockHeader(oldNextBlock)
                if (oldNextBlockBodyLength === 0) {
                  // 如果"原下一个块"是未分配的, 则将"原下一个块"合并进新块.
                  this.setBlockHeader(newNextBlock, [oldNextBlockNextBlock, 0])
                }
              }
            }
          }

          return bodyOffset
        }
      }
      blockOffset = nextBlock
    }

    throw new Error('Out of bounds')
  }

  /**
   * @param byteOffset 绝对偏移值
   */
  free(byteOffset: number): void {
    return this._free(byteOffset - this.byteOffset)
  }

  private _free(offset: number): void {
    for (const blockOffset of this.blocks()) {
      const [nextBlock, bodyLength] = this.getBlockHeader(blockOffset)

      // 如果当前块就是要释放的块, 说明要释放的块是缓冲区中的第一个块
      if (blockOffset + Allocator.headerByteLength === offset) {
        const targetBlock = blockOffset

        // 将目标块设置为未分配.
        this.setBlockHeader(targetBlock, [nextBlock, 0])

        if (nextBlock + Allocator.headerByteLength < this.byteLength) {
          // 如果下一个块是未分配的, 则将下一个块合并进当前块.
          const [nextBlockNextBlock, nextBlockBodyLength] = this.getBlockHeader(nextBlock)
          if (nextBlockBodyLength === 0) {
            this.setBlockHeader(targetBlock, [nextBlockNextBlock, 0])
          }
        }

        return
      } else {
        // 对于要释放的块不是缓冲区中的第一个块的情况, 则需要获得"要释放的块"的前一个块的位置,
        // 用于之后可能发生的合并.
        if (nextBlock + Allocator.headerByteLength === offset) {
          const previousBlock = blockOffset
          const previousBodyLength = bodyLength
          const targetBlock = nextBlock
          const [targetNextBlock] = this.getBlockHeader(targetBlock)

          // 将目标块设置为未分配.
          this.setBlockHeader(targetBlock, [targetNextBlock, 0])

          if (targetNextBlock + Allocator.headerByteLength < this.byteLength) {
            // 如果下一个块是未分配的, 则将下一个块合并进当前块.
            const [
              nextBlockNextBlock
            , nextBlockBodyLength
            ] = this.getBlockHeader(targetNextBlock)
            if (nextBlockBodyLength === 0) {
              this.setBlockHeader(targetBlock, [nextBlockNextBlock, 0])
            }

            // 如果上一个块是未分配的, 则将当前块合并进上一个块.
            if (previousBodyLength === 0) {
              const [targetNextBlock] = this.getBlockHeader(targetBlock)
              this.setBlockHeader(previousBlock, [targetNextBlock, 0])
            }
          }

          return
        }
      }
    }

    throw new Error('The offset is not allocated')
  }

  private setBlockHeader(
    blockOffset: number
  , [nextBlock, bodyLength]: [nextBlock: number, bodyLength: number]
  ): void {
    this.view.setUint32(blockOffset, nextBlock)
    this.view.setUint32(blockOffset + Uint32Array.BYTES_PER_ELEMENT, bodyLength)
  }

  private getBlockHeader(blockOffset: number): [nextBlock: number, bodyLength: number] {
    const nextBlock = this.view.getUint32(blockOffset)
    const bodyLength = this.view.getUint32(blockOffset + Uint32Array.BYTES_PER_ELEMENT)
    return [nextBlock, bodyLength]
  }

  private validateBufferFormat(): boolean {
    let blocks = 0
    for (const blockOffset of this.blocks()) {
      blocks++

      const [nextBlock, bodyLength] = this.getBlockHeader(blockOffset)
      if (bodyLength !== 0) {
        // 块的主体长度不为零, 说明块已分配.

        if (blockOffset + Allocator.headerByteLength + bodyLength !== nextBlock) {
          return false
        }
      }
    }
    return blocks > 0
  }

  private * blocks(): IterableIterator<number> {
    let blockOffset = 0
    while (blockOffset + Allocator.headerByteLength <= this.byteLength) {
      yield blockOffset

      const [nextBlock] = this.getBlockHeader(blockOffset)
      blockOffset = nextBlock
    }
  }
}

function allZeros(view: DataView): boolean {
  for (let i = 0; i < view.byteLength; i++) {
    if (view.getUint8(i) !== 0) return false
  }
  return true
}
