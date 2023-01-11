import { go } from '@blackglory/go'
import { Allocator, HashSet, Uint16View, uint16 } from '..'
import { Benchmark } from 'extra-benchmark'
import { MB } from './utils'

const benchmark = new Benchmark('HashSet')

go(async () => {
  benchmark.addCase('Set#set', () => {
    const count = 10000
    const set = new Set<number>()

    return {
      beforeEach() {
        set.clear()
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          set.add(i)
        }
      }
    }
  })

  benchmark.addCase('HashSet#set', () => {
    const count = 10000
    let allocator: Allocator<ArrayBuffer>
    let set: HashSet<Uint16View>

    return {
      beforeEach() {
        allocator = new Allocator(new ArrayBuffer(50 * MB))
        set = new HashSet(allocator, Uint16View)
      }
    , iterate() {
        for (let i = 0; i < count; i++) {
          set.add(uint16(i))
        }
      }
    }
  })

  benchmark.addCase('Set#has', () => {
    const count = 10000
    const set = new Set<number>()
    for (let i = 0; i < count; i += 2) {
      set.add(i)
    }

    return () =>{
      for (let i = 0; i < count; i++) {
        set.has(i)
      }
    }
  })

  benchmark.addCase('HashSet#has', () => {
    const count = 10000
    const allocator = new Allocator(new ArrayBuffer(50 * MB))
    const set = new HashSet(allocator, Uint16View)
    for (let i = 0; i < count; i += 2) {
      set.add(uint16(i))
    }

    return () => {
      for (let i = 0; i < count; i++) {
        set.has(uint16(i))
      }
    }
  })

  console.log(`Benchmark: ${benchmark.name}`)
  for await (const result of benchmark.run()) {
    console.log(result)
  }
})
