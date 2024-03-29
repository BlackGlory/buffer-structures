import { Uint16Literal, uint16 } from '@literals/uint16-literal.js'
import { IHasher } from '@src/interfaces.js'
import { uint16ToBuffer } from '@test/utils.js'
import { BaseLiteral } from '@literals/base-literal.js'

test('uint16', () => {
  const result = uint16(1)

  expect(result).toBeInstanceOf(Uint16Literal)
  expect(result.get()).toBe(1)
})

describe('Uint16Literal', () => {
  test('create', () => {
    const result = new Uint16Literal(1)

    expect(result).toBeInstanceOf(BaseLiteral)
    expect(result.get()).toBe(1)
  })

  test('get', () => {
    const literal = new Uint16Literal(1)

    const result = literal.get()

    expect(result).toBe(1)
  })

  test('hash', () => {
    const literal = new Uint16Literal(1)
    const hasher = {
      write: vi.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(uint16ToBuffer(1))
  })
})
