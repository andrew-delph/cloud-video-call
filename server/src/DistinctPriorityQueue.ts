import { OrderedSet } from "immutable";

export class DistinctPriorityQueue<T> {
  myOrderedSet: OrderedSet<T>;

  constructor() {
    this.myOrderedSet = OrderedSet<T>().asMutable();
  }

  add(value: T) {
    this.myOrderedSet.add(value);
  }

  remove(value: T) {
    this.myOrderedSet.remove(value);
  }

  pop() {
    const popValue = this.myOrderedSet.first();
    if (!popValue) return undefined;
    this.myOrderedSet.remove(popValue);
    return popValue;
  }

  size(): number {
    return this.myOrderedSet.size;
  }
}
