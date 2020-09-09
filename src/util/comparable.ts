export default interface Comparable<T extends Comparable<T>> {
  /** Compares this element to another and returns the sorting order. */
  compareTo(other: T): -1 | 0 | 1;
}
