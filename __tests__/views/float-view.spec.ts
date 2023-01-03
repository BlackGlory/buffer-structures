import { FloatView } from '@views/float-view'
import { float32ToBytes } from '@test/utils'
import { IHasher } from '@src/types'

describe('FloatView', () => {
  test('byteLength', () => {
    const result = FloatView.byteLength

    expect(result).toBe(Float32Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new FloatView(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -3
    const dataView = new DataView(buffer)
    dataView.setFloat32(byteOffset, value)
    const doubleView = new FloatView(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -3
    const doubleView = new FloatView(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getFloat32(byteOffset)).toBe(value)
  })

  test('hash', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = -3
    const view = new FloatView(buffer, byteOffset)
    view.set(value)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    view.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(float32ToBytes(-3))
  })
})
