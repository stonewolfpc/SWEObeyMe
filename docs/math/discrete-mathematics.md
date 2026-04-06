# Discrete Mathematics for Algorithms

> **Purpose**: Essential discrete math concepts for algorithm design and analysis

## Sets

**Definition**: A collection of distinct elements

**Set Operations**:
- Union: A ∪ B = {x | x ∈ A or x ∈ B}
- Intersection: A ∩ B = {x | x ∈ A and x ∈ B}
- Difference: A - B = {x | x ∈ A and x ∉ B}
- Complement: A' = {x | x ∉ A}

**Properties**:
- |A ∪ B| = |A| + |B| - |A ∩ B|
- Power set: P(A) = all subsets of A
- |P(A)| = 2^|A|

## Logic

**Propositional Logic**:
- p ∧ q: AND
- p ∨ q: OR
- ¬p: NOT
- p → q: implies
- p ↔ q: if and only if

**Truth Tables**:
- Used to evaluate logical expressions
- De Morgan's Laws: ¬(p ∧ q) = ¬p ∨ ¬q

**Predicate Logic**:
- ∀x P(x): For all x, P(x) is true
- ∃x P(x): There exists x such that P(x) is true
- ∀x ∃y P(x,y): For every x, there exists y such that...

## Graph Theory

**Graph**: G = (V, E) where V = vertices, E = edges

**Graph Types**:
- Directed vs Undirected
- Weighted vs Unweighted
- Connected vs Disconnected
- Cyclic vs Acyclic

**Graph Representations**:
- Adjacency Matrix: O(V²) space, O(1) edge check
- Adjacency List: O(V + E) space, O(degree) edge check

**Graph Traversals**:
- BFS: O(V + E), shortest path in unweighted graphs
- DFS: O(V + E), topological sort, cycle detection

**Key Concepts**:
- Path: sequence of vertices connected by edges
- Cycle: path that starts and ends at same vertex
- Connected component: maximal connected subgraph
- Degree: number of edges incident to vertex

**Minimum Spanning Tree**:
- Kruskal's: O(E log E)
- Prim's: O(E log V)

**Shortest Path**:
- Dijkstra: O((V + E) log V) for non-negative weights
- Bellman-Ford: O(VE) for negative weights
- Floyd-Warshall: O(V³) for all pairs

## Trees

**Tree**: Connected acyclic graph

**Binary Tree**: Each node has at most 2 children

**Properties**:
- Height: longest path from root to leaf
- Balanced: height = O(log n)
- Complete: all levels filled except possibly last

**Tree Traversals**:
- Inorder: left, root, right
- Preorder: root, left, right
- Postorder: left, right, root

**Binary Search Tree**:
- Left subtree < root < right subtree
- Search: O(h) where h = height
- Balanced BST: O(log n)

## Combinatorics

**Permutations**: nPk = n! / (n-k)!
- Order matters
- Example: arrangements of k items from n

**Combinations**: nCk = n! / (k!(n-k)!)
- Order doesn't matter
- Example: choose k items from n

**Pascal's Identity**: nCk = n-1Ck-1 + n-1Ck

**Binomial Theorem**: (x + y)ⁿ = ∑(k=0 to n) nCk × xᵏ × yⁿ⁻ᵏ

**Applications**:
- Counting problems
- Probability calculations
- Algorithm analysis

## Recursion and Induction

**Mathematical Induction**:
1. Base case: Prove for n = 1
2. Inductive step: Assume true for n, prove for n+1

**Strong Induction**:
- Assume true for all k < n, prove for n

**Recursive Relations**:
- T(n) = T(n-1) + O(1) → O(n)
- T(n) = 2T(n/2) + O(n) → O(n log n)
- T(n) = 2T(n/2) + O(1) → O(n)

**Master Theorem**:
- T(n) = aT(n/b) + f(n)
- Compare f(n) with n^(log_b a)

## Number Theory

**Divisibility**: a divides b if b = ka for some integer k

**Modular Arithmetic**:
- a ≡ b (mod n) if n divides (a - b)
- Applications: hashing, cryptography

**GCD**: gcd(a,b) = largest integer dividing both a and b
- Euclidean algorithm: O(log min(a,b))

**LCM**: lcm(a,b) = ab / gcd(a,b)

**Prime Numbers**:
- Prime: only divisible by 1 and itself
- Sieve of Eratosthenes: O(n log log n)

**Applications**:
- Cryptography (RSA)
- Hash functions
- Random number generation

## Algorithm Design Patterns

**Divide and Conquer**:
- Split problem into subproblems
- Solve subproblems recursively
- Combine solutions
- Example: Merge sort, Quick sort

**Dynamic Programming**:
- Overlapping subproblems
- Optimal substructure
- Memoization or tabulation
- Example: Fibonacci, Knapsack

**Greedy**:
- Make locally optimal choice
- Hope for global optimum
- Example: Huffman coding, Prim's algorithm

**Backtracking**:
- Explore all possibilities
- Prune invalid branches
- Example: N-Queens, Sudoku

## Complexity Classes

**P**: Problems solvable in polynomial time
- Example: Sorting, shortest path

**NP**: Problems verifiable in polynomial time
- Example: SAT, traveling salesman

**NP-Complete**: Hardest problems in NP
- Example: 3-SAT, vertex cover

**NP-Hard**: At least as hard as NP-complete
- May not be in NP

## Proof Techniques

**Direct Proof**:
- Assume P, show Q follows

**Proof by Contradiction**:
- Assume not Q, show contradiction

**Proof by Contrapositive**:
- Prove not Q → not P instead of P → Q

**Proof by Induction**:
- Base case + inductive step

**Proof by Construction**:
- Build example to show existence
