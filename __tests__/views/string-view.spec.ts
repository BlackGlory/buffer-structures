import { StringView } from '@views/string-view.js'
import { bufferToBytes, getSlice, setSlice, uint32ToBuffer } from '@test/utils.js'
import { toArray } from '@blackglory/prelude'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { BaseView } from '@views/base-view.js'
import { string } from '@literals/string-literal.js'

describe('StringView', () => {
  test('create', () => {
    const buffer = new ArrayBuffer(100)

    const result = new StringView(buffer, 0)

    expect(result).toBeInstanceOf(BaseView)
  })

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

    expect(result).toBe(Uint32Array.BYTES_PER_ELEMENT + 50)
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
    , allocate: vi.fn()
    , free: vi.fn()
    } satisfies IAllocator
    const byteOffset = 1
    const view = new StringView(allocator.buffer, byteOffset)

    view.free(allocator)

    expect(allocator.free).toBeCalledTimes(1)
    expect(allocator.free).toBeCalledWith(byteOffset, view.byteLength)
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

    expect(result).toStrictEqual(string(value))
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = string('foo')
    const stringView = new StringView(buffer, byteOffset)

    stringView.set(value)

    expect(
      bufferToBytes(getSlice(
        buffer
      , byteOffset
      , Uint32Array.BYTES_PER_ELEMENT + Buffer.from(value.get(), 'utf-8').byteLength
      ))
    ).toStrictEqual([
      ...bufferToBytes(uint32ToBuffer(Buffer.from(value.get(), 'utf-8').byteLength))
    , ...bufferToBytes(Buffer.from(value.get(), 'utf-8'))
    ])
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new StringView(buffer, byteOffset)
    view.set(string('foo'))
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(Buffer.from('foo').buffer)
  })
})
