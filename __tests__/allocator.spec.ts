import { Allocator } from '@src/allocator'
import { getError } from 'return-style'
import { repeat } from 'extra-generator'
import { setSlice, bufferToArray, uint32ToBuffer } from '@test/utils'

describe('Allocator', () => {
  describe('create', () => {
    test('too small to initialize', () => {
      const buffer = new ArrayBuffer(Allocator.headerByteLength - 1)

      const err = getError(() => new Allocator(buffer))

      expect(err).toBeInstanceOf(Error)
      expect(err?.message).toMatch('too small to initialize')
    })

    test('empty buffer', () => {
      const buffer = new ArrayBuffer(Allocator.headerByteLength)

      const allocator = new Allocator(buffer)

      expect(
        bufferToArray(allocator.buffer)
      ).toStrictEqual([
        // header
        ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength)) // 4
      , ...bufferToArray(uint32ToBuffer(0)) // 4
        // body
      ])
    })

    test('byteOffset', () => {
      const byteOffset = 1
      const buffer = new ArrayBuffer(byteOffset + Allocator.headerByteLength)

      const allocator = new Allocator(buffer, byteOffset)

      expect(
        bufferToArray(allocator.buffer)
      ).toStrictEqual([
        0
      , // header
        ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength)) // 4
      , ...bufferToArray(uint32ToBuffer(0)) // 4
        // body
      ])
    })

    test('byteLength', () => {
      const byteLength = Allocator.headerByteLength
      const buffer = new ArrayBuffer(Allocator.headerByteLength + 1)

      const allocator = new Allocator(buffer, 0, byteLength)

      expect(
        bufferToArray(allocator.buffer)
      ).toStrictEqual([
        // header
        ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength)) // 4
      , ...bufferToArray(uint32ToBuffer(0)) // 4
        // body
        // out of bounds
      , 0
      ])
    })

    describe('non-empty buffer', () => {
      test('valid buffer', () => {
        const buffer = new ArrayBuffer(Allocator.headerByteLength)
        const view = new DataView(buffer)
        setSlice(view, 0, [
          ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength))
        , ...bufferToArray(uint32ToBuffer(0))
        ])

        new Allocator(buffer)
      })

      test('invalid buffer', () => {
        const buffer = new ArrayBuffer(Allocator.headerByteLength)
        const view = new DataView(buffer)
        for (let i = buffer.byteLength; i--;) {
          view.setUint8(i, i)
        }

        const err = getError(() => new Allocator(buffer))

        expect(err).toBeInstanceOf(Error)
        expect(err?.message).toMatch('invalid')
      })
    })
  })

  describe('allocate', () => {
    test('size === 0', () => {
      const buffer = new ArrayBuffer(Allocator.headerByteLength)
      const allocator = new Allocator(buffer)

      const err = getError(() => allocator.allocate(0))

      expect(err).toBeInstanceOf(Error)
      expect(err?.message).toMatch('should be greater than zero')
    })

    describe('size > 0', () => {
      describe('use the unallocated block', () => {
        describe('the unallocated block is the only block', () => {
          test('exhausts the buffer', () => {
            const byteOffset = 1
            const buffer = new ArrayBuffer(byteOffset + Allocator.headerByteLength + 1)
            const allocator = new Allocator(buffer, byteOffset)

            const result = allocator.allocate(1)

            expect(result).toBe(byteOffset + Allocator.headerByteLength)
            expect(bufferToArray(allocator.buffer)).toStrictEqual([
              0
              // header
            , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
            , ...bufferToArray(uint32ToBuffer(1)) // 4
              // body
            , 0 // 1
            ])
          })

          describe('does not exhausts the buffer', () => {
            test('remaining size < headerByteLength', () => {
              const byteOffset = 1
              const buffer = new ArrayBuffer(
                byteOffset
              + Allocator.headerByteLength + 1
              + 1
              )
              const allocator = new Allocator(buffer, byteOffset)

              const result = allocator.allocate(1)

              expect(result).toBe(byteOffset + Allocator.headerByteLength)
              expect(bufferToArray(allocator.buffer)).toStrictEqual([
                0
                // header
              , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
              , ...bufferToArray(uint32ToBuffer(1)) // 4
                // body
              , 0 // 1
              , 0
              ])
            })

            test('remaining size = headerByteLength', () => {
              const byteOffset = 1
              const buffer = new ArrayBuffer(
                byteOffset
              + Allocator.headerByteLength + 1
              + Allocator.headerByteLength
              )
              const allocator = new Allocator(buffer, byteOffset)

              const result = allocator.allocate(1)

              expect(result).toBe(byteOffset + Allocator.headerByteLength)
              expect(bufferToArray(allocator.buffer)).toStrictEqual([
                0
                // header
              , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
              , ...bufferToArray(uint32ToBuffer(1)) // 4
                // body
              , 0 // 1
              , ...repeat(0, Allocator.headerByteLength)
              ])
            })

            test('remaining size > headerByteLength', () => {
              const byteOffset = 1
              const buffer = new ArrayBuffer(
                byteOffset
              + Allocator.headerByteLength + 1
              + Allocator.headerByteLength + 1
              )
              const allocator = new Allocator(buffer, byteOffset)

              const result = allocator.allocate(1)

              expect(result).toBe(byteOffset + Allocator.headerByteLength)
              expect(bufferToArray(allocator.buffer)).toStrictEqual([
                0
                // header
              , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
              , ...bufferToArray(uint32ToBuffer(1)) // 4
                // body
              , 0 // 1
                // header
              , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
              , ...bufferToArray(uint32ToBuffer(0)) // 4
              , 0
              ])
            })
          })
        })

        test('the unallocated block is not the only block', () => {
          const byteOffset = 1
          const buffer = new ArrayBuffer(
            byteOffset
          + (Allocator.headerByteLength + 1) * 2
          )
          const allocator = new Allocator(buffer, byteOffset)
          allocator.allocate(1)

          const result = allocator.allocate(1)

          expect(result).toBe(
            byteOffset
          + Allocator.headerByteLength + 1
          + Allocator.headerByteLength
          )
          expect(bufferToArray(allocator.buffer)).toStrictEqual([
            0
            // header
          , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
          , ...bufferToArray(uint32ToBuffer(1)) // 4
            // body
          , 0 // 1
            // header
          , ...bufferToArray(uint32ToBuffer(
              Allocator.headerByteLength + 1
            + Allocator.headerByteLength + 1
            )) // 4
          , ...bufferToArray(uint32ToBuffer(1)) // 4
            // body
          , 0 // 1
          ])
        })
      })

      test('reuse the first freed block that bigger than or equal to size', () => {
        const byteOffset = 1
        const buffer = new ArrayBuffer(
          byteOffset
        + (Allocator.headerByteLength + 1) * 3
        )
        const allocator = new Allocator(buffer, byteOffset)
        const offset1 = allocator.allocate(1)
        const offset2 = allocator.allocate(1)
        const offset3 = allocator.allocate(1)
        allocator.free(offset1)
        allocator.free(offset3)

        const result = allocator.allocate(1)

        expect(result).toBe(offset1)
        expect(bufferToArray(allocator.buffer)).toStrictEqual([
          0
          // header
        , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
        , ...bufferToArray(uint32ToBuffer(1)) // 4
          // body
        , 0 // 1
          // header
        , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
        , ...bufferToArray(uint32ToBuffer(1)) // 4
          // body
        , 0 // 1
          // header
        , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
        , ...bufferToArray(uint32ToBuffer(0)) // 4
          // body
        , 0 // 1
        ])
      })

      test('out of bounds', () => {
        const buffer = new ArrayBuffer(100)
        const allocator = new Allocator(buffer)

        const err = getError(() => allocator.allocate(100))

        expect(err).toBeInstanceOf(Error)
        expect(err?.message).toMatch('Out of bounds')
      })
    })
  })

  describe('free', () => {
    test('non-allocated offset', () => {
      const byteOffset = 1
      const buffer = new ArrayBuffer(byteOffset + Allocator.headerByteLength + 1)
      const allocator = new Allocator(buffer, byteOffset)

      const err = getError(() => allocator.free(0))

      expect(err).toBeInstanceOf(Error)
      expect(err!.message).toMatch('The offset is not allocated')
    })

    describe('allocated offset', () => {
      test('the freed block is the only block', () => {
        const byteOffset = 1
        const buffer = new ArrayBuffer(byteOffset + Allocator.headerByteLength + 1)
        const allocator = new Allocator(buffer, byteOffset)
        const offset = allocator.allocate(1)

        allocator.free(offset)

        expect(bufferToArray(allocator.buffer)).toStrictEqual([
          0
          // header
        , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
        , ...bufferToArray(uint32ToBuffer(0)) // 4
          // body
        , 0 // 1
        ])
      })

      test('the freed block is the first block', () => {
        const byteOffset = 1
        const buffer = new ArrayBuffer(
          byteOffset
        + (Allocator.headerByteLength + 1) * 2
        )
        const allocator = new Allocator(buffer, byteOffset)
        const offset = allocator.allocate(1)
        allocator.allocate(1)

        allocator.free(offset)

        expect(bufferToArray(allocator.buffer)).toStrictEqual([
          0
          // header
        , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
        , ...bufferToArray(uint32ToBuffer(0)) // 4
          // body
        , 0 // 1
          // header
        , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
        , ...bufferToArray(uint32ToBuffer(1)) // 4
          // body
        , 0 // 1
        ])
      })

      test('the freed block is the last block', () => {
        const byteOffset = 1
        const buffer = new ArrayBuffer(
          byteOffset
        + (Allocator.headerByteLength + 1) * 2
        )
        const allocator = new Allocator(buffer, byteOffset)
        allocator.allocate(1)
        const offset = allocator.allocate(1)

        allocator.free(offset)

        expect(bufferToArray(allocator.buffer)).toStrictEqual([
          0
          // header
        , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
        , ...bufferToArray(uint32ToBuffer(1)) // 4
          // body
        , 0 // 1
          // header
        , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
        , ...bufferToArray(uint32ToBuffer(0)) // 4
        , 0 // 1
        ])
      })

      test('the freed block is the middle block', () => {
        const byteOffset = 1
        const buffer = new ArrayBuffer(
          byteOffset
        + (Allocator.headerByteLength + 1) * 3
        )
        const allocator = new Allocator(buffer, byteOffset)
        allocator.allocate(1)
        const offset = allocator.allocate(1)
        allocator.allocate(1)

        allocator.free(offset)

        expect(bufferToArray(allocator.buffer)).toStrictEqual([
          0
          // header
        , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
        , ...bufferToArray(uint32ToBuffer(1)) // 4
          // body
        , 0 // 1
          // header
        , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
        , ...bufferToArray(uint32ToBuffer(0)) // 4
        , 0 // 1
          // header
        , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
        , ...bufferToArray(uint32ToBuffer(1)) // 4
          // body
        , 0 // 1
        ])
      })

      describe('merge unallocated blocks', () => {
        test('[unallocated, free now], allocated', () => {
          const byteOffset = 1
          const buffer = new ArrayBuffer(
            byteOffset
          + (Allocator.headerByteLength + 1) * 3
          )
          const allocator = new Allocator(buffer, byteOffset)
          const offset1 = allocator.allocate(1)
          const offset2 = allocator.allocate(1)
          allocator.allocate(1)
          allocator.free(offset1)

          allocator.free(offset2)

          expect(bufferToArray(allocator.buffer)).toStrictEqual([
            0
            // freed block header
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
            // freed block body
          , 0 // 1
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 2)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
          , 0 // 1
            // header
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
          , ...bufferToArray(uint32ToBuffer(1)) // 4
            // body
          , 0 // 1
          ])
        })

        test('allocated, [free now, unallocated]', () => {
          const byteOffset = 1
          const buffer = new ArrayBuffer(
            byteOffset
          + (Allocator.headerByteLength + 1) * 3
          )
          const allocator = new Allocator(buffer, byteOffset)
          allocator.allocate(1)
          const offset1 = allocator.allocate(1)
          const offset2 = allocator.allocate(1)
          allocator.free(offset2)

          allocator.free(offset1)

          expect(bufferToArray(allocator.buffer)).toStrictEqual([
            0
            // header
          , ...bufferToArray(uint32ToBuffer(Allocator.headerByteLength + 1)) // 4
          , ...bufferToArray(uint32ToBuffer(1)) // 4
            // body
          , 0 // 1
            // freed block header
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
            // freed block body
          , 0 // 1
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
          , 0 // 1
          ])
        })

        test('[unallocated, free now, unallocated]', () => {
          const byteOffset = 1
          const buffer = new ArrayBuffer(
            byteOffset
          + (Allocator.headerByteLength + 1) * 3
          )
          const allocator = new Allocator(buffer, byteOffset)
          const offset1 = allocator.allocate(1)
          const offset2 = allocator.allocate(1)
          const offset3 = allocator.allocate(1)
          allocator.free(offset1)
          allocator.free(offset3)

          allocator.free(offset2)

          expect(bufferToArray(allocator.buffer)).toStrictEqual([
            0
            // freed block header
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
            // freed block body
          , 0 // 1
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
          , 0 // 1
          , ...bufferToArray(uint32ToBuffer((Allocator.headerByteLength + 1) * 3)) // 4
          , ...bufferToArray(uint32ToBuffer(0)) // 4
          , 0 // 1
          ])
        })
      })
    })
  })
})
