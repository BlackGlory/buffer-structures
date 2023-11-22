import { Int16Literal, int16 } from '@literals/int16-literal.js'
import { IHasher } from '@src/interfaces.js'
import { int16ToBuffer } from '@test/utils.js'
import { BaseLiteral } from '@literals/base-literal.js'

test('int16', () => {
  const result = int16(1)

  expect(result).toBeInstanceOf(Int16Literal)
  expect(result.get()).toBe(1)
})

describe('Int16Literal', () => {
  test('create', () => {
    const result = new Int16Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Int16Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Int16Literal(1)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(int16ToBuffer(1))
  })
})
