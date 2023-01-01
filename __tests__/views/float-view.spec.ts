import { FloatView } from '@views/float-view'

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
})
