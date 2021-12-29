import { add } from './sum';

describe('Test Suite for Sum', () => {
  test('should return sum of 2 numbers', () => {
    expect(add(1, 2)).toEqual(3);
  });
});

/* test('t1', () => {
  expect(1).toEqual(1);
}); */
