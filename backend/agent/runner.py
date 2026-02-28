"""Cortex Agent Runner — Entry point for per-user agent containers."""

from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Cortex Agent")


@app.get("/health")
def health():
    return {"status": "ok", "service": "cortex-agent"}


@app.get("/")
def root():
    return {"message": "Cortex Agent is running. Waiting for agent tools."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
