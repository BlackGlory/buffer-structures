import { Int32Literal, int32 } from '@literals/int32-literal'
import { IHasher } from '@src/interfaces'
import { int32ToBuffer } from '@test/utils'
import { BaseLiteral } from '@literals/base-literal'

test('int32', () => {
  const result = int32(1)

  expect(result).toBeInstanceOf(Int32Literal)
  expect(result.get()).toBe(1)
})

describe('Int32Literal', () => {
  test('create', () => {
    const result = new Int32Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Int32Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Int32Literal(1)
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int32ToBuffer(1))
  })
})
