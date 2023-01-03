import { Uint32View } from '@views/uint32-view'
import { uint32ToBytes } from '@test/utils'
import { IHasher } from '@src/types'

describe('Uint32View', () => {
  test('byteLength', () => {
    const result = Uint32View.byteLength

    expect(result).toBe(Uint32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new Uint32View(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const dataView = new DataView(buffer)
    dataView.setUint32(byteOffset, value)
    const doubleView = new Uint32View(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const doubleView = new Uint32View(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getUint32(byteOffset)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 1000000
    const view = new Uint32View(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint32ToBytes(1000000))
  })
})
