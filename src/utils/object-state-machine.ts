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
