# Algorithm Complexity Notation

> **Purpose**: Reference for Big O notation and algorithm complexity analysis used in programming

## Big O Notation

Big O notation describes the upper bound of an algorithm's time or space complexity.

### Common Complexity Classes

**O(1) - Constant Time**

- Accessing array element by index
- Hash table lookups (average case)

```javascript
arr[0]; // O(1)
map.get(key); // O(1) average
```

**O(log n) - Logarithmic Time**

- Binary search
- Balanced tree operations

```javascript
// Binary search on sorted array
function binarySearch(arr, target) {
  let left = 0,
    right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

**O(n) - Linear Time**

- Simple iteration
- Linear search

```javascript
for (let i = 0; i < n; i++) {
  // O(n)
}
```

**O(n log n) - Linearithmic Time**

- Merge sort
- Heap sort
- Quick sort (average case)

```javascript
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  // O(n log n) divide and conquer
}
```

**O(n²) - Quadratic Time**

- Nested loops
- Bubble sort
- Selection sort

```javascript
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    // O(n²)
  }
}
```

**O(2ⁿ) - Exponential Time**

- Recursive solutions without memoization
- Brute force algorithms

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2); // O(2ⁿ)
}
```

## Space Complexity

**O(1) - Constant Space**

- In-place algorithms
- Fixed number of variables

**O(n) - Linear Space**

- Arrays, lists
- Recursion depth

**O(n²) - Quadratic Space**

- 2D matrices
- Nested data structures

## Omega (Ω) and Theta (Θ)

**Ω (Omega)** - Lower bound (best case)

```
Ω(n) = at least n operations
```

**Θ (Theta)** - Tight bound (average case)

```
Θ(n) = exactly n operations (within constant factors)
```

## Common Patterns

**Amortized Analysis**

- Average performance over sequence of operations
- Dynamic array resizing: O(1) amortized

**Master Theorem**

- For divide and conquer: T(n) = aT(n/b) + f(n)
- Used to analyze recursive algorithms

## Practical Tips

1. **Prefer O(1) over O(n)** when possible
2. **Use hash tables** for O(1) lookups
3. **Sort first** then binary search: O(n log n) + O(log n)
4. **Avoid nested loops** when n is large
5. **Memoization** reduces O(2ⁿ) to O(n)
