import { StringView } from '@views/string-view'
import { getSlice, setSlice, uint32ToBytes } from '@test/utils'
import { toArray } from '@blackglory/prelude'
import { IAllocator, IHasher } from '@src/types'

describe('StringView', () => {
  test('getByteLength', () => {
    const value = 'foo'

    const result = StringView.getByteLength(value)

    expect(result).toBe(
      Uint32Array.BYTES_PER_ELEMENT
    + Buffer.from(value, 'utf-8').byteLength
    )
  })

  test('byteLength', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, 50)
    const view = new StringView(buffer, byteOffset)

    const result = view.byteLength

    expect(result).toBe(50)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new StringView(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('free', () => {
    const allocator = {
      buffer: new ArrayBuffer(100)
    , allocate: jest.fn()
    , free: jest.fn()
    } satisfies IAllocator
    const byteOffset = 1
    const view = new StringView(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset)
  })

  test('get', () => {
    const value = 'foo'
    const byteLength = Buffer.from(value, 'utf-8').byteLength
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, byteLength)
    setSlice(
      dataView
    , 1 + Uint32Array.BYTES_PER_ELEMENT
    , toArray(Buffer.from(value, 'utf-8'))
    )
    const stringView = new StringView(buffer, byteOffset)

    const result = stringView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 'foo'
    const stringView = new StringView(buffer, byteOffset)

    stringView.set(value)

    const dataView = new DataView(buffer)
    expect(
      getSlice(
        dataView
      , byteOffset
      , Uint32Array.BYTES_PER_ELEMENT + Buffer.from(value, 'utf-8').byteLength
      )
    ).toStrictEqual([
      ...uint32ToBytes(Buffer.from(value, 'utf-8').byteLength)
    , ...Buffer.from(value, 'utf-8')
    ])
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new StringView(buffer, byteOffset)
    view.set('foo')
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith([...Buffer.from('foo')])
  })
})
