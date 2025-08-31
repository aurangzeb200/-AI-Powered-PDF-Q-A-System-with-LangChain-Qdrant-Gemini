# 📄 AI-Powered PDF Q&A System with LangChain, Qdrant & Gemini

This project implements an intelligent document question-answering pipeline that uses LangChain to load and chunk PDF content, combines dense and sparse retrieval using HuggingFace embeddings and BM25 (FastEmbedSparse), and finally generates natural language responses using Gemini 1.5 Flash (Google GenAI).

The system supports metadata indexing, hybrid retrieval, custom prompts, and real-time querying via a terminal-based loop. Fully in-memory setup using Qdrant and tested in Google Colab.

---

## 🔍 Techniques of Interest

- PDF parsing and metadata extraction using [`PyPDFLoader`](https://python.langchain.com/docs/modules/data_connection/document_loaders/pdf) and [`pypdf`](https://pypdf.readthedocs.io/)
- Chunking using [`RecursiveCharacterTextSplitter`](https://python.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/)
- Dense vector embedding with [`HuggingFaceEmbeddings`](https://python.langchain.com/docs/integrations/text_embedding/huggingface/)
- Sparse retrieval via [`FastEmbedSparse`](https://python.langchain.com/docs/integrations/vectorstores/qdrant/)
- Hybrid search fusion using [Reciprocal Rank Fusion (RRF)](https://en.wikipedia.org/wiki/Reciprocal_rank_fusion)
- Custom prompt template engineering and conversational querying
- Direct use of [Gemini API](https://ai.google.dev/) with `genai.Client`

---

## 🛠 Libraries and Tools

- [LangChain](https://www.langchain.com/)
- [HuggingFace Sentence Transformers](https://www.sbert.net/)
- [Qdrant](https://qdrant.tech/)
- [Google GenAI / Gemini](https://ai.google.dev/)
- [PyPDF](https://pypdf.readthedocs.io/)
- [Google Colab](https://colab.research.google.com/)

---


## ⚠️ Notes

- Requires a valid Google Gemini API key
- Designed for interactive use inside a notebook or Colab environment
