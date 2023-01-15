import { assert } from '@blackglory/prelude'
import { FiniteStateMachine } from 'extra-fsm'

enum ObjectState {
  Allocated
, Freed
}

enum ObjectEvent {
  Free
}

export class ObjectStateMachine {
  private fsm = new FiniteStateMachine<ObjectState, ObjectEvent>({
    [ObjectState.Allocated]: {
      [ObjectEvent.Free]: ObjectState.Freed
    }
  , [ObjectState.Freed]: {}
  }, ObjectState.Allocated)

  free(): void {
    this.fsm.send(ObjectEvent.Free)
  }

  assertAllocated() {
    assert(this.fsm.matches(ObjectState.Allocated), 'The object is not allocated')
  }
}

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
