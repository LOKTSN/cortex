## Adaptive Sparse Attention for 10M Context Windows

Chen et al. (2026) introduce a novel attention mechanism enabling **10 million token context windows** with practical compute costs.

### Method
- Learned token routing selects ~1% of tokens per attention head
- Hierarchical compression maintains global context awareness
- Dynamic sparsity patterns adapt per-layer and per-head

### Results
- 99.2% of full attention quality on SCROLLS benchmark
- 100x compute reduction vs dense attention
- Linear scaling with context length (vs quadratic for dense)

### Implications
This could enable models to process entire codebases or book-length documents in a single pass, fundamentally changing how we approach long-context tasks.
