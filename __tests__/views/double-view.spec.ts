import { DoubleView } from '@views/double-view'

describe('DoubleView', () => {
  test('byteLength', () => {
    const result = DoubleView.byteLength

    expect(result).toBe(Float64Array.BYTES_PER_ELEMENT)
  })

  test('byteOffset', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const view = new DoubleView(buffer, byteOffset)

    const result = view.byteOffset

    expect(result).toBe(byteOffset)
  })

  test('get', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 3.14
    const dataView = new DataView(buffer)
    dataView.setFloat64(byteOffset, value)
    const doubleView = new DoubleView(buffer, byteOffset)

    const result = doubleView.get()

    expect(result).toBe(value)
  })

  test('set', () => {
    const buffer = new ArrayBuffer(100)
    const byteOffset = 1
    const value = 3.14
    const doubleView = new DoubleView(buffer, byteOffset)

    doubleView.set(value)

    const dataView = new DataView(buffer)
    expect(dataView.getFloat64(byteOffset)).toBe(value)
  })
})
