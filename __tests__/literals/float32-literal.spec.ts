import { Float32Literal, float32 } from '@literals/float32-literal.js'
import { IHasher } from '@src/interfaces.js'
import { float64ToBuffer } from '@test/utils.js'
import { BaseLiteral } from '@literals/base-literal.js'

test('Float32', () => {
  const result = float32(1)

  expect(result).toBeInstanceOf(Float32Literal)
  expect(result.get()).toBe(1)
})

describe('Float32Literal', () => {
  test('create', () => {
    const result = new Float32Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Float32Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Float32Literal(1)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(float64ToBuffer(1))
  })
})
