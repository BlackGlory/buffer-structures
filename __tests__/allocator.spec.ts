import { Allocator } from '@src/allocator.js'
import { getError } from 'return-style'
import { bufferToBytes } from '@test/utils.js'

// 固定跳过缓冲区的第一个字节, 因为它被视作NULL.
const nullSize = 1

describe('Allocator', () => {
  describe('create', () => {
    test('without metadata', () => {
      const buffer = new ArrayBuffer(nullSize + 1)

      const allocator = new Allocator(buffer)

      expect(bufferToBytes(allocator.buffer)).toStrictEqual([0, 0])
      expect(allocator.metadata).toStrictEqual({
        freeLists: [
          { byteOffset: nullSize, byteLength: 1 }
        ]
      })
    })

    test('with metadata', () => {
      const buffer = new ArrayBuffer(nullSize + 3)

      const allocator = new Allocator(buffer, {
        freeLists: [{ byteOffset: 2, byteLength: 2 }]
      })

      expect(bufferToBytes(allocator.buffer)).toStrictEqual([0, 0, 0, 0])
      expect(allocator.metadata).toStrictEqual({
        freeLists: [
          { byteOffset: 2, byteLength: 2 }
        ]
      })
    })
  })

  describe('allocate', () => {
    test('size === 0', () => {
      const buffer = new ArrayBuffer(nullSize + 1)
      const allocator = new Allocator(buffer)

      const err = getError(() => allocator.allocate(0))

      expect(err).toBeInstanceOf(Error)
      expect(err?.message).toMatch('should be greater than zero')
    })

    describe('size > 0', () => {
      describe('use the unallocated block', () => {
        describe('the unallocated block is the only block', () => {
          test('exhausts the buffer', () => {
            const buffer = new ArrayBuffer(nullSize + 1)
            const allocator = new Allocator(buffer)

            const result = allocator.allocate(1)

            expect(result).toBe(nullSize)
            expect(allocator.metadata).toStrictEqual({
              freeLists: []
            })
          })

          test('does not exhausts the buffer', () => {
            const buffer = new ArrayBuffer(nullSize + 1 * 2)
            const allocator = new Allocator(buffer)

            const result = allocator.allocate(1)

            expect(result).toBe(nullSize)
            expect(allocator.metadata).toStrictEqual({
              freeLists: [
                { byteOffset: nullSize + 1, byteLength: 1 }
              ]
            })
          })
        })

        test('the unallocated block is not the only block', () => {
          const buffer = new ArrayBuffer(nullSize + 1 * 2)
          const allocator = new Allocator(buffer)
          allocator.allocate(1)

          const result = allocator.allocate(1)

          expect(result).toBe(nullSize + 1)
          expect(allocator.metadata).toStrictEqual({
            freeLists: []
          })
        })
      })

      test('reuse the first freed block that bigger than or equal to size', () => {
        const buffer = new ArrayBuffer(nullSize + 1 * 3)
        const allocator = new Allocator(buffer)
        const offset1 = allocator.allocate(1)
        const offset2 = allocator.allocate(1)
        const offset3 = allocator.allocate(1)
        allocator.free(offset1, 1)
        allocator.free(offset3, 1)

        const result = allocator.allocate(1)

        expect(result).toBe(offset1)
        expect(allocator.metadata).toStrictEqual({
          freeLists: [
            { byteOffset: offset3, byteLength: 1 }
          ]
        })
      })

      test('out of bounds', () => {
        const buffer = new ArrayBuffer(nullSize)
        const allocator = new Allocator(buffer)

        const err = getError(() => allocator.allocate(1))

        expect(err).toBeInstanceOf(Error)
        expect(err?.message).toMatch('Out of bounds')
      })
    })
  })

  describe('free', () => {
    test('non-allocated offset', () => {
      const buffer = new ArrayBuffer(nullSize + 1)
      const allocator = new Allocator(buffer)

      const err = getError(() => allocator.free(nullSize, 1))

      expect(err).toBeInstanceOf(Error)
      expect(err!.message).toMatch('The offset is not allocated')
    })

    describe('allocated offset', () => {
      test('the freed block is the only block', () => {
        const buffer = new ArrayBuffer(nullSize + 1)
        const allocator = new Allocator(buffer)
        const offset = allocator.allocate(1)

        allocator.free(offset, 1)

        expect(allocator.metadata).toStrictEqual({
          freeLists: [
            { byteOffset: nullSize, byteLength: 1 }
          ]
        })
      })

      test('the freed block is the first block', () => {
        const buffer = new ArrayBuffer(nullSize + 1 * 2)
        const allocator = new Allocator(buffer)
        const offset = allocator.allocate(1)
        allocator.allocate(1)

        allocator.free(offset, 1)

        expect(allocator.metadata).toStrictEqual({
          freeLists: [
            { byteOffset: nullSize, byteLength: 1 }
          ]
        })
      })

      test('the freed block is the last block', () => {
        const buffer = new ArrayBuffer(nullSize + 1 * 2)
        const allocator = new Allocator(buffer)
        allocator.allocate(1)
        const offset = allocator.allocate(1)

        allocator.free(offset, 1)

        expect(allocator.metadata).toStrictEqual({
          freeLists: [
            { byteOffset: offset, byteLength: 1 }
          ]
        })
      })

      test('the freed block is the middle block', () => {
        const buffer = new ArrayBuffer(nullSize + 1 * 3)
        const allocator = new Allocator(buffer)
        const offset1 = allocator.allocate(1)
        const offset2 = allocator.allocate(1)
        const offset3 = allocator.allocate(1)

        allocator.free(offset2, 1)

        expect(allocator.metadata).toStrictEqual({
          freeLists: [
            { byteOffset: offset2, byteLength: 1 }
          ]
        })
      })

      describe('merge unallocated freeLists', () => {
        test('[unallocated, free now], allocated', () => {
          const buffer = new ArrayBuffer(nullSize + 1 * 3)
          const allocator = new Allocator(buffer)
          const offset1 = allocator.allocate(1)
          const offset2 = allocator.allocate(1)
          const offset3 = allocator.allocate(1)
          allocator.free(offset1, 1)

          allocator.free(offset2, 1)

          expect(allocator.metadata).toStrictEqual({
            freeLists: [
              { byteOffset: offset1, byteLength: 2 }
            ]
          })
        })

        test('allocated, [free now, unallocated]', () => {
          const buffer = new ArrayBuffer(nullSize + 1 * 3)
          const allocator = new Allocator(buffer)
          const offset1 = allocator.allocate(1)
          const offset2 = allocator.allocate(1)
          const offset3 = allocator.allocate(1)
          allocator.free(offset3, 1)

          allocator.free(offset2, 1)

          expect(allocator.metadata).toStrictEqual({
            freeLists: [
              { byteOffset: offset2, byteLength: 2 }
            ]
          })
        })

        test('[unallocated, free now, unallocated]', () => {
          const buffer = new ArrayBuffer(nullSize + 1 * 3)
          const allocator = new Allocator(buffer)
          const offset1 = allocator.allocate(1)
          const offset2 = allocator.allocate(1)
          const offset3 = allocator.allocate(1)
          allocator.free(offset1, 1)
          allocator.free(offset3, 1)

          allocator.free(offset2, 1)

          expect(allocator.metadata).toStrictEqual({
            freeLists: [
              { byteOffset: offset1, byteLength: 3 }
            ]
          })
        })
      })
    })
  })
})
