import { Int8View } from '@views/int8-view'
import { int8ToBytes } from '@test/utils'
import { IHasher } from '@src/types'

describe('Int8View', () => {
  test('byteLength', () => {
    const result = Int8View.byteLength

    expect(result).toBe(Int8Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Int8View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const dataView = new DataView(buffer)
    dataView.setInt8(byteOffset, value)
    const doubleView = new Int8View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const doubleView = new Int8View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getInt8(byteOffset)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -127
    const view = new Int8View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int8ToBytes(-127))
  })
})
