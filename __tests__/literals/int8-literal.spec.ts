import { Int8Literal, int8 } from '@literals/int8-literal.js'
import { IHasher } from '@src/interfaces.js'
import { int8ToBuffer } from '@test/utils.js'
import { BaseLiteral } from '@literals/base-literal.js'

test('int8', () => {
  const result = int8(1)

  expect(result).toBeInstanceOf(Int8Literal)
  expect(result.get()).toBe(1)
})

describe('Int8Literal', () => {
  test('create', () => {
    const result = new Int8Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Int8Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Int8Literal(1)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int8ToBuffer(1))
  })
})
