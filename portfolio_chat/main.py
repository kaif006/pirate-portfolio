import os
from functools import lru_cache
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai

load_dotenv()

@lru_cache(maxsize=1)
def gemini_client():
    return genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Folder containing our Markdown documents
KNOWLEDGE_FOLDER = Path(__file__).resolve().parents[1] / "data" / "knowledge"


def load_documents():
    documents = []

    # Find every Markdown file in the knowledge folder
    for file_path in sorted(KNOWLEDGE_FOLDER.glob("*.md")):
        if file_path.name == "README.md":
            continue
        # Read the document
        content = file_path.read_text(encoding="utf-8")

        documents.append({"source": file_path.name, "content": content})

    return documents


def chunk_documents(documents, chunk_size=1000):

    chunks = []

    for document in documents:
        # Split document into paragraphs
        paragraphs = document["content"].split("\n\n")

        current_chunk = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()

            if not paragraph:
                continue

            # Check whether adding this paragraph exceeds our limit
            if len(current_chunk) + len(paragraph) > chunk_size:
                if current_chunk:
                    chunks.append(
                        {"source": document["source"], "content": current_chunk.strip()}
                    )

                current_chunk = paragraph

            else:
                current_chunk += "\n\n" + paragraph

        # Save the remaining text
        if current_chunk:
            chunks.append(
                {"source": document["source"], "content": current_chunk.strip()}
            )

    return chunks


def generate_embedding(text):

    response = gemini_client().models.embed_content(
        model=os.getenv("GEMINI_EMBED_MODEL") or "gemini-embedding-001",
        contents=text,
    )

    return response.embeddings[0].values


def build_index():
    chunks = chunk_documents(load_documents())
    if not chunks:
        raise RuntimeError("No portfolio knowledge found")
    for chunk in chunks:
        chunk["embedding"] = generate_embedding(chunk["content"])
    return chunks


def cosine_similarity(vector_a, vector_b):

    vector_a = np.array(vector_a)
    vector_b = np.array(vector_b)

    similarity = np.dot(vector_a, vector_b) / (
        np.linalg.norm(vector_a) * np.linalg.norm(vector_b)
    )

    return similarity


def retrieve_chunks(question, chunks, top_k=3):

    # Convert the user's question into an embedding
    question_embedding = generate_embedding(question)

    similarities = []

    # Compare question with every chunk
    for chunk in chunks:
        score = cosine_similarity(question_embedding, chunk["embedding"])

        similarities.append(
            {"source": chunk["source"], "content": chunk["content"], "score": score}
        )

    # Sort by highest similarity
    similarities.sort(key=lambda item: item["score"], reverse=True)

    # Return the top K chunks
    return similarities[:top_k]


def generate_answer(question, retrieved_chunks):

    # Combine retrieved information into one context
    context = ""

    for chunk in retrieved_chunks:
        context += f"\nSource: {chunk['source']}\n"
        context += chunk["content"] + "\n"

    prompt = f"""
    You are a personal portfolio chatbot representing the person
    described in the provided information.

    RESPONSE RULES:
    - Speak in first person, as if you are this person.
    - Be natural, friendly, and conversational.
    - Only provide facts supported by the supplied context.
    - Never invent projects, skills, experiences, or achievements.
    - If the information is insufficient, say so honestly.
    - Do not refer to yourself as an AI assistant.
    - Do not assume that missing information is true.

    INFORMATION:
    {context}

    VISITOR'S QUESTION:
    {question}

    Answer the visitor naturally:
    """

    response = gemini_client().models.generate_content(
        model=os.getenv("GEMINI_CHAT_MODEL") or "gemini-3.5-flash-lite",
        contents=prompt,
        config={"max_output_tokens": 400},
    )

    return response.text


if __name__ == "__main__":
    question = "What projects have you worked on?"
    results = retrieve_chunks(question, build_index())
    print(generate_answer(question, results))
