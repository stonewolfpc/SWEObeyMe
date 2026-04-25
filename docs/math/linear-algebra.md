# Linear Algebra for AI/ML

> **Purpose**: Essential linear algebra concepts for machine learning and AI programming

## Vectors

**Definition**: A vector is an ordered list of numbers (elements)

**Notation**: x = [x₁, x₂, ..., xₙ]

**Vector Operations**:

- Addition: x + y = [x₁ + y₁, ..., xₙ + yₙ]
- Scalar multiplication: αx = [αx₁, ..., αxₙ]
- Dot product: x · y = ∑(i=1 to n) xᵢyᵢ
- Norm: ||x|| = √(x · x) = √(∑xᵢ²)

**Common Norms**:

- L1 norm: ||x||₁ = ∑|xᵢ|
- L2 norm: ||x||₂ = √(∑xᵢ²)
- L∞ norm: ||x||∞ = max(|xᵢ|)

## Matrices

**Definition**: A rectangular array of numbers

**Notation**: A = [aᵢⱼ] where i = row, j = column

**Matrix Operations**:

- Addition: A + B = [aᵢⱼ + bᵢⱼ]
- Scalar multiplication: αA = [αaᵢⱼ]
- Matrix multiplication: (AB)ᵢⱼ = ∑(k) aᵢₖbₖⱼ
- Transpose: Aᵀ where (Aᵀ)ᵢⱼ = aⱼᵢ

**Special Matrices**:

- Identity: I (diagonal = 1, others = 0)
- Zero matrix: 0 (all elements = 0)
- Symmetric: A = Aᵀ
- Orthogonal: AᵀA = I

## Matrix Properties

**Determinant**: |A| = scalar value

- If |A| = 0, matrix is singular (no inverse)
- |AB| = |A| × |B|

**Inverse**: A⁻¹ where AA⁻¹ = I

- Only exists if |A| ≠ 0
- (A⁻¹)ᵀ = (Aᵀ)⁻¹

**Rank**: Number of linearly independent rows/columns

- Full rank = min(rows, cols)
- Rank deficiency indicates redundancy

## Eigenvalues and Eigenvectors

**Definition**: Ax = λx where λ is eigenvalue, x is eigenvector

**Characteristic equation**: |A - λI| = 0

**Applications**:

- Principal Component Analysis (PCA)
- PageRank algorithm
- Stability analysis
- Dimensionality reduction

## Matrix Decompositions

**LU Decomposition**: A = LU

- L = lower triangular
- U = upper triangular
- Used for solving linear systems

**QR Decomposition**: A = QR

- Q = orthogonal matrix
- R = upper triangular
- Used for least squares

**SVD (Singular Value Decomposition)**: A = UΣVᵀ

- U, V = orthogonal matrices
- Σ = diagonal matrix of singular values
- Most general decomposition

## Linear Systems

**Solving Ax = b**:

- If A is square and invertible: x = A⁻¹b
- Gaussian elimination
- LU decomposition

**Least Squares**: Minimize ||Ax - b||²

- Solution: x = (AᵀA)⁻¹Aᵀb
- Used for regression

## ML Applications

**Data Representation**:

- Dataset as matrix X (rows = samples, cols = features)
- Target vector y
- Weights vector w

**Linear Regression**:

- Prediction: ŷ = Xw
- Loss: L = ||y - Xw||²
- Solution: w = (XᵀX)⁻¹Xᵀy

**Neural Networks**:

- Weight matrices for each layer
- Activation functions applied element-wise
- Backpropagation uses matrix calculus

**Principal Component Analysis**:

- Covariance matrix: C = (1/n)XᵀX
- Eigenvectors of C = principal components
- Dimensionality reduction

## Programming Examples

**Vector in Python (NumPy)**:

```python
import numpy as np
x = np.array([1, 2, 3])
y = np.array([4, 5, 6])
dot = np.dot(x, y)  # 32
norm = np.linalg.norm(x)  # 3.74
```

**Matrix in Python (NumPy)**:

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
product = np.dot(A, B)  # Matrix multiplication
inverse = np.linalg.inv(A)
eigenvals, eigenvecs = np.linalg.eig(A)
```

**Linear Algebra in JavaScript**:

```javascript
// Simple vector operations
function dotProduct(a, b) {
  return a.reduce((sum, x, i) => sum + x * b[i], 0);
}

function norm(v) {
  return Math.sqrt(dotProduct(v, v));
}
```

## Key Concepts for AI

**Vector Spaces**:

- Span: all linear combinations of vectors
- Basis: minimal set of spanning vectors
- Dimension: number of basis vectors

**Linear Independence**:

- Vectors are independent if no vector is a linear combination of others
- Critical for feature selection

**Projection**:

- Project vector onto subspace
- Used in regression and dimensionality reduction

**Orthogonality**:

- Perpendicular vectors (dot product = 0)
- Orthogonal bases simplify computations
