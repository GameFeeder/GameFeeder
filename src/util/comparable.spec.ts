import Comparable, * as comparable from './comparable';

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
    expect(comparable.sort([second, first])).toEqual([first, second]);
  });

  test('should limit an array returning last elements', () => {
    expect(comparable.limitEnd([first, third, second], 1)).toEqual([second]);
    expect(comparable.limitEnd([first, third, second])).toEqual([first, third, second]);
  });

  test('should limit and sort an array returning first elements', () => {
    expect(comparable.sortLimitStart([first, third, second], 1)).toEqual([first]);
    expect(comparable.sortLimitStart([first, third, second])).toEqual([first, second, third]);
  });

  test('should limit and sort an array returning last elements', () => {
    expect(comparable.sortLimitEnd([first, third, second], 1)).toEqual([third]);
    expect(comparable.sortLimitEnd([first, third, second])).toEqual([first, second, third]);
  });
});
