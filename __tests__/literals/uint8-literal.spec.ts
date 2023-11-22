import { Uint8Literal, uint8 } from '@literals/uint8-literal.js'
import { IHasher } from '@src/interfaces.js'
import { uint8ToBuffer } from '@test/utils.js'
import { BaseLiteral } from '@literals/base-literal.js'

test('uint8', () => {
  const result = uint8(1)

  expect(result).toBeInstanceOf(Uint8Literal)
  expect(result.get()).toBe(1)
})

describe('Uint8Literal', () => {
  test('create', () => {
    const result = new Uint8Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Uint8Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Uint8Literal(1)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint8ToBuffer(1))
  })
})
