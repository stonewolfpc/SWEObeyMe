# Probability and Statistics for ML

> **Purpose**: Essential probability and statistics concepts for machine learning and AI

## Basic Probability

**Definition**: P(A) = probability of event A, 0 ≤ P(A) ≤ 1

**Key Properties**:
- P(A) + P(not A) = 1
- P(A or B) = P(A) + P(B) - P(A and B)
- If A and B are independent: P(A and B) = P(A) × P(B)
- If A and B are mutually exclusive: P(A or B) = P(A) + P(B)

**Conditional Probability**: P(A|B) = P(A and B) / P(B)
- Probability of A given B occurred
- Bayes' Theorem: P(A|B) = P(B|A) × P(A) / P(B)

## Random Variables

**Definition**: A variable that takes on values based on random process

**Types**:
- Discrete: Countable values (e.g., coin flip, dice roll)
- Continuous: Any value in range (e.g., height, time)

**Expected Value**: E[X] = ∑x × P(X=x) (discrete)
- Also called mean or average
- Linearity: E[aX + b] = aE[X] + b

**Variance**: Var(X) = E[(X - E[X])²] = E[X²] - (E[X])²
- Measure of spread
- Var(aX + b) = a²Var(X)

**Standard Deviation**: σ = √Var(X)
- Same units as X
- Measure of typical deviation from mean

## Common Distributions

**Bernoulli**: Single trial with success/failure
- P(X=1) = p, P(X=0) = 1-p
- E[X] = p, Var(X) = p(1-p)
- Used for: binary classification

**Binomial**: n independent Bernoulli trials
- P(X=k) = C(n,k) × pᵏ × (1-p)ⁿ⁻ᵏ
- E[X] = np, Var(X) = np(1-p)
- Used for: number of successes in n trials

**Poisson**: Number of events in fixed interval
- P(X=k) = (λᵏ × e⁻λ) / k!
- E[X] = λ, Var(X) = λ
- Used for: rare events, count data

**Normal (Gaussian)**: Bell curve
- X ~ N(μ, σ²)
- Probability density: f(x) = (1/σ√(2π)) × e^(-(x-μ)²/(2σ²))
- E[X] = μ, Var(X) = σ²
- Used for: natural phenomena, CLT

**Uniform**: Equal probability over range
- X ~ U(a,b)
- f(x) = 1/(b-a) for a ≤ x ≤ b
- E[X] = (a+b)/2, Var(X) = (b-a)²/12

## Statistics

**Sample Mean**: x̄ = (1/n)∑xᵢ
- Estimator of population mean μ

**Sample Variance**: s² = (1/(n-1))∑(xᵢ - x̄)²
- Estimator of population variance σ²

**Standard Error**: SE = s/√n
- Standard deviation of sample mean

**Confidence Interval**: x̄ ± z × SE
- Range likely to contain true mean
- z depends on confidence level (95%: z=1.96)

## Hypothesis Testing

**Null Hypothesis (H₀)**: Default assumption (no effect)
**Alternative Hypothesis (H₁)**: What we want to prove

**p-value**: Probability of observing results if H₀ is true
- p < 0.05: Reject H₀ (statistically significant)
- p ≥ 0.05: Fail to reject H₀

**Type I Error**: False positive (reject H₀ when true)
**Type II Error**: False negative (fail to reject H₀ when false)

## ML Applications

**Loss Functions**:
- Mean Squared Error: MSE = (1/n)∑(y - ŷ)²
- Cross-Entropy: CE = -∑y × log(ŷ)

**Regularization**:
- L1 (Lasso): λ∑|w|
- L2 (Ridge): λ∑w²
- Prevents overfitting

**Gradient Descent**:
- θ = θ - α × ∇L(θ)
- α = learning rate
- ∇L = gradient of loss

**Confidence Intervals in ML**:
- Bootstrapping: Resample with replacement
- Bayesian methods: Posterior distribution

**A/B Testing**:
- Compare two versions
- Use statistical significance
- Sample size calculation

## Probability in Programming

**Random Number Generation**:
```python
import random
import numpy as np

# Uniform [0,1]
x = random.random()

# Normal distribution
x = np.random.normal(0, 1)

# Sample from list
choices = random.sample(population, k)
```

**Monte Carlo Simulation**:
- Estimate by random sampling
- Example: Estimate π by random points in circle

**Bayesian Inference**:
- Update beliefs with new evidence
- Prior → Posterior via Bayes' theorem

## Key Concepts

**Law of Large Numbers**: Sample mean converges to expected value as n → ∞

**Central Limit Theorem**: Sample mean distribution approaches normal as n → ∞

**Bayes' Theorem**: P(A|B) = P(B|A) × P(A) / P(B)
- Foundation of Bayesian ML

**Maximum Likelihood**: Choose parameters that maximize probability of observed data

**Maximum A Posteriori (MAP)**: Choose parameters that maximize posterior probability
