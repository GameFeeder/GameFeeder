import * as arrayUtil from 'src/util/array_util.js';
import Comparable from 'src/util/comparable.js';

class TestComparable implements Comparable<TestComparable> {
  value: number;

  constructor(v: number) {
    this.value = v;
  }

  compareTo(other: TestComparable) {
    if (this.value < other.value) {
      return -1;
    }
    if (this.value > other.value) {
      return 1;
    }
    return 0;
  }
}

const first = new TestComparable(1);
const second = new TestComparable(2);
const secondAgain = new TestComparable(2);
const third = new TestComparable(3);

describe('Comparable', () => {
  test('should implement compareTo', () => {
    expect(first.compareTo(second)).toBe(-1);
    expect(second.compareTo(first)).toBe(1);
    expect(second.compareTo(secondAgain)).toBe(0);
  });

  test('should sort an array of comparable values', () => {
    expect(arrayUtil.sort([second, first])).toEqual([first, second]);
  });

  test('should limit and sort an array returning first elements', () => {
    expect(arrayUtil.sortLimitStart([first, third, second], 1)).toEqual([first]);
    expect(arrayUtil.sortLimitStart([first, third, second])).toEqual([first, second, third]);
  });

  test('should limit and sort an array returning last elements', () => {
    expect(arrayUtil.sortLimitEnd([first, third, second], 1)).toEqual([third]);
    expect(arrayUtil.sortLimitEnd([first, third, second])).toEqual([first, second, third]);
  });
});
