# AI-Powered PDF Q&A System with LangChain, Qdrant, and Gemini

Modern, full-stack RAG (Retrieval-Augmented Generation) application for intelligent document processing and conversational AI over PDFs. This project leverages LangChain for document handling, Qdrant for vector search, HuggingFace embeddings, and Google Gemini for generative AI responses, wrapped in a beautiful React frontend.

## Features

- **PDF Upload & Chunking:** Upload PDF documents, automatically split into content chunks for efficient retrieval.
- **Semantic Search:** Dense and sparse embedding models for accurate information retrieval, powered by HuggingFace and Qdrant.
- **Conversational Q&A:** Ask questions about your PDF content and receive smart, context-aware answers.
- **Source Attribution:** Responses include references to page numbers, confidence scores, and document metadata.
- **Modern UI:** Responsive React interface with elegant glassmorphism styling, dark mode, and smooth interactions.
- **Fast Local/Cloud Search:** Uses Qdrant vector database (memory or persistent) for fast chunk indexing and search.
- **Custom Embeddings:** Supports "sentence-transformers/all-mpnet-base-v2" for dense embeddings and BM25 for sparse retrieval.
- **Generative Answers:** Google Gemini API for advanced language generation and summarization.

## Architecture

- **Backend:** Python (rag_system.py)
  - Loads PDF via `PyPDFLoader`.
  - Extracts metadata and splits document into chunks.
  - Embeds chunks with HuggingFace and Qdrant FastEmbedSparse models.
  - Stores and indexes chunks in Qdrant (in-memory or persistent).
  - Provides endpoints for chat-based Q&A.
  - Integrates with Google Gemini for generative answers.

- **Frontend:** React + Vite
  - Upload, manage, and browse documents.
  - Ask questions and view answers in conversational chat.
  - UI components for chat, sidebar, pagination, charts, carousels, and more.
  - Source highlighting and answer confidence metrics.

## Quick Start

1. **Clone the repository**
    ```bash
    git clone https://github.com/aurangzeb200/-AI-Powered-PDF-Q-A-System-with-LangChain-Qdrant-Gemini.git
    cd -AI-Powered-PDF-Q-A-System-with-LangChain-Qdrant-Gemini
    ```

2. **Install Backend Requirements**
    ```bash
    pip install torch langchain qdrant-client pypdf google-colab huggingface-hub
    ```

3. **Install Frontend Requirements**
    ```bash
    npm install
    ```

4. **Run the Backend**
    - Configure Google Gemini API key in Google Colab or your environment.
    - Start the backend service (see `rag_system.py` for details).

5. **Run the Frontend**
    ```bash
    npm run dev
    ```

## Usage

- Upload PDF files via the web UI or backend API.
- Ask questions; responses leverage both retrieval and generative AI.
- Inspect answers, view referenced sources, and explore document context.

## Technologies

- **LangChain** – Document loading, chunking, and processing.
- **Qdrant** – Vector database for semantic search.
- **HuggingFace** – Embedding models for semantic similarity.
- **Google Gemini** – Generative AI responses.
- **React + Vite** – Modern frontend stack.
- **Tailwind CSS** – Responsive, glassmorphism UI.

## File Structure

- `rag_system.py` – Core backend logic for RAG pipeline.
- `src/` – Frontend React components and utilities.
- `index.html` – App entry point.
- `vite.config.ts` – Vite configuration for frontend.

## Acknowledgements

- [LangChain](https://github.com/langchain-ai/langchain)
- [Qdrant](https://qdrant.tech/)
- [HuggingFace Transformers](https://huggingface.co/)
- [Google Gemini](https://ai.google.dev/gemini)
- [Embla Carousel](https://www.embla-carousel.com/)
- [Lucide React Icons](https://lucide.dev/)

## License

MIT

---

Lovable Generated Project | Built by [aurangzeb200](https://github.com/aurangzeb200)
