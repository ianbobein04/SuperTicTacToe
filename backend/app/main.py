from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.tictactoe.router import router as t3_router

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      # set False if you’re not using cookies/auth
    allow_methods=["*"],         # or ["GET","POST","DELETE","OPTIONS"]
    allow_headers=["*"],         # must allow "content-type"
)

app.include_router(t3_router)