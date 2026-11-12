from fastapi import FastAPI

app = FastAPI(title="OptionAI Backend")

@app.get("/")
def read_root():
    return {"message": "OptionAI Backend is running!"}