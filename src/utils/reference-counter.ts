import { assert } from '@blackglory/prelude'

export class ReferenceCounter {
  public _count: number = 1

  increment(): void {
    this._count++
  }

  decrement(): void {
    assert(this._count > 0, 'The count cannot decrease to a negative value')

    this._count--
  }

  isZero(): boolean {
    return this._count === 0
  }
}
