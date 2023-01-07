import { StringLiteral, string } from '@literals/string'
import { IHasher } from '@src/types'

test('string', () => {
  const result = string('foo')

  expect(result).toBeInstanceOf(StringLiteral)
  expect(result.get()).toBe('foo')
})

describe('StringLiteral', () => {
  test('get', () => {
    const literal = new StringLiteral('foo')

    const result = literal.get()

    expect(result).toBe('foo')
  })

  test('set', () => {
    const literal = new StringLiteral('foo')

    literal.set('bar')

    expect(literal.get()).toBe('bar')
  })

  test('hash', () => {
    const literal = new StringLiteral('foo')
    const hasher = {
      write: jest.fn()
    } satisfies IHasher

    literal.hash(hasher)

    expect(hasher.write).toBeCalledTimes(1)
    expect(hasher.write).toBeCalledWith(Buffer.from('foo').buffer)
  })
})
