## TL;DR

T²-RAGBench is a newly introduced benchmark comprising 23,088 question-context-answer triples designed to evaluate Retrieval-Augmented Generation systems on documents containing both textual and tabular data. The benchmark specifically challenges models to first retrieve the correct context—integrating both text and tables—before performing numerical reasoning to generate accurate answers. Accepted to EACL 2026, this benchmark addresses a critical gap in RAG evaluation, as hybrid text-table documents are prevalent across finance, business, and scientific domains where state-of-the-art methods still struggle.

## Key Insights

**1. Benchmark Design Targets Real-World Complexity**

The dataset's structure explicitly separates retrieval from reasoning: models must first identify and retrieve the relevant passage and table before performing numerical operations. This two-stage challenge mirrors actual enterprise workflows where answers depend on synthesizing information across modalities—a capability not captured by existing RAG benchmarks focused on pure text or isolated tables.

**2. Hybrid BM25 Outperforms Dense Retrievers**

Surprisingly, a hybrid BM25 approach proved most effective, surpassing dense retrieval methods. This suggests that for text-table hybrid documents, traditional sparse retrieval with appropriate term matching still captures relevant context more reliably than learned dense embeddings, likely because tables contain structured data that dense models struggle to represent effectively.

**3. SOTA Methods Face Significant Challenges**

Despite advances in RAG systems, the benchmark remains difficult for current state-of-the-art approaches. This indicates that integrating and reasoning over heterogeneous document types—where tables provide quantitative context and text provides narrative explanation—remains an open problem requiring architectural innovations beyond current retrieval and generation pipelines.

## Why This Matters

For practitioners building RAG systems in data-intensive domains, T²-RAGBench provides a rigorous evaluation framework exposing a fundamental capability gap: effectively retrieving and reasoning across multimodal documents remains unsolved, demanding new approaches that can jointly handle textual narrative and tabular data structures.