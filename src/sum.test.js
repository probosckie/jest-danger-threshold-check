import {add, add2} from './sum';

describe('Test Suite for Sum', () => {
  test('should return sum of 2 numbers', () => {
    expect(add(1,2)).toEqual(3)
  });

  test('should return sum of 2 other numbers', () => {
    expect(add(2,2)).toEqual(4)
  });
});