import logging
from threading import Lock

from fastapi import FastAPI, HTTPException
from pydantic import AliasChoices, BaseModel, Field

from .main import build_index, generate_answer, retrieve_chunks

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
logger = logging.getLogger(__name__)
index_lock = Lock()
index = None


class ChatRequest(BaseModel):
    question: str = Field(
        min_length=1, max_length=500, validation_alias=AliasChoices("question", "message")
    )


@app.post("/chat", include_in_schema=False)
@app.post("/api/portfolio-chat")
def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Please enter a question.")

    global index
    try:
        with index_lock:
            if index is None:
                index = build_index()
            chunks = index

        results = retrieve_chunks(question, chunks)
        answer = generate_answer(question, results)
        if not answer or not answer.strip():
            raise RuntimeError("Gemini returned an empty answer")
    except Exception as exc:
        logger.error("Portfolio chat failed (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="The assistant is unavailable.") from exc

    return {"answer": answer.strip()}
