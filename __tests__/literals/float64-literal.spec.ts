import { Float64Literal, float64 } from '@literals/float64-literal.js'
import { IHasher } from '@src/interfaces.js'
import { float64ToBuffer } from '@test/utils.js'
import { BaseLiteral } from '@literals/base-literal.js'

test('float64', () => {
  const result = float64(1)

  expect(result).toBeInstanceOf(Float64Literal)
  expect(result.get()).toBe(1)
})

describe('Float64Literal', () => {
  test('create', () => {
    const result = new Float64Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Float64Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Float64Literal(1)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(float64ToBuffer(1))
  })
})
