// Example test file for utilities
describe('Utility Functions', () => {
  describe('String Utilities', () => {
    test('should handle empty strings', () => {
      const emptyString = '';
      expect(emptyString.length).toBe(0);
    });

    test('should trim whitespace', () => {
      const str = '  test  ';
      expect(str.trim()).toBe('test');
    });
  });

  describe('Array Utilities', () => {
    test('should filter arrays correctly', () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter((x) => x > 2);
      expect(filtered).toEqual([3, 4, 5]);
    });

    test('should map arrays correctly', () => {
      const arr = [1, 2, 3];
      const mapped = arr.map((x) => x * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });
  });
});
