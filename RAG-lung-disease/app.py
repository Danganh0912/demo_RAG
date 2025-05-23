from tools import get_ollama_response, get_gemini_response
from chat_database import SQLiteDB
from vector_database import search_similar_texts, search_answered_questions, add_answered_question_to_qdrant, cleanup_old_answers
from tools import combine_content

from fastapi import FastAPI, HTTPException 
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from typing import Optional
from pydantic import BaseModel
import uuid

scheduler = BackgroundScheduler()
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        cleanup_old_answers,
        trigger=IntervalTrigger(seconds=120),
        id="cleanup_job",
        kwargs={"age_seconds": 120} 
    )
    scheduler.start()   
    yield               
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

db = SQLiteDB()
SUPPORTED_MODELS = {"qwen:7b", "gemini"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    user_id: int
    model: Optional[str] = "qwen:7b" 

class Conversation(BaseModel):
    conversation_id: str

class RegisterUser(BaseModel):
    username: str
    email: str
    password: str

class LoginUser(BaseModel):
    email: str
    password: str


#check connection
@app.get("/health")
async def health_check():
    try:
        db.connect()  
        return JSONResponse(
            status_code=200,
            content={
                "code": 200,
                "status": 1,
                "message": "Server is running and database connection is OK"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

#user api
@app.post("/register")
async def register(user: RegisterUser):
    result = db.add_user(user.username, user.email, user.password)
    if result == "DUPLICATE_EMAIL":
        raise HTTPException(
            status_code=409,
            detail="Email đã được sử dụng"
        )
    if isinstance(result, str) and result.startswith("DB_ERROR"):
        raise HTTPException(status_code=500, detail=result)
    return JSONResponse(
        status_code=201,
        content={
            "code": 201,
            "status": 1,
            "message": "User registered successfully",
            "data": {
                "user_id": result,
                "email": user.email,
                "username": user.username
            }
        }
    )

@app.post("/login")
async def login(user: LoginUser):
    login_result = db.check_login(user.email, user.password)
    if login_result is None:
        raise HTTPException(status_code=401, detail="Mật khẩu hoặc tài khoản không chính xác")
    return JSONResponse(
        status_code=200,
        content={
            "code": 200,
            "status": 1,
            "message": "Login successful",
            "data": login_result
        }
    )

#chat api
@app.post("/chat")
async def chat_endpoint(message: Message):

    selected_model = message.model.lower()
    if selected_model not in SUPPORTED_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model '{message.model}'. Supported models: {', '.join(SUPPORTED_MODELS)}"
        )

    if not message.conversation_id:
        new_conv_id = str(uuid.uuid4())
        result = db.add_conversation(new_conv_id, message.message)
        if result is not True:
            raise HTTPException(status_code=500, detail=result)
        link_result = db.add_user_conversation(message.user_id, new_conv_id)
        if link_result is not True:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to link user {message.user_id} with conversation {new_conv_id}"
            )
        conv_id = new_conv_id
    else:
        conv_id = message.conversation_id

 
    existing = search_answered_questions(message.message, limit=1)
    if existing:
        response_content = existing[0]["answer"]
    else:
        
        knowledge = search_similar_texts(message.message, 7)
        data = combine_content(knowledge)

    
        if selected_model == "gemini":
            response_content = get_gemini_response(message.message, data)
            # response_content = "Phản hồi của gemini"
        else:
            response_content = get_ollama_response(message.message, data)
            # response_content = "Phản hồi của ollama"

        if response_content == "Error":
            raise HTTPException(status_code=500, detail="Failed to generate response")
        add_answered_question_to_qdrant(message.message, response_content)
    # Persist the message and response
    add_msg_result = db.add_message(conv_id, message.message, response_content)
    if add_msg_result is not True:
        raise HTTPException(status_code=500, detail=add_msg_result)

    return {
        "code": 200,
        "status": 1,
        "message": "Success",
        "data": {
            "conversation_id": conv_id,
            "message": message.message,
            "answer": response_content,
            "model_used": selected_model
        }
    }


@app.get("/chat_history/{conversation_id}")
async def chat_history(conversation_id: str, limit: int = 50):
    history = db.get_chat_history(conversation_id, limit)
    if isinstance(history, str):
        raise HTTPException(status_code=500, detail=history)
    return JSONResponse(
        status_code=200,
        content={
            "code": 200,
            "status": 1,
            "message": "Success",
            "data": history
        }
    )

@app.get("/get_conversations/{user_id}")
async def get_user_conversations(user_id: int):
    conversations = db.get_user_conversations(user_id)
    if isinstance(conversations, str):
        raise HTTPException(status_code=500, detail=conversations)
    return JSONResponse(
        status_code=200,
        content={
            "code": 200,
            "status": 1,
            "message": "User conversations retrieved successfully",
            "data": [
                {"conversation_id": conv["conversation_id"], "title": conv["title"]} 
                for conv in conversations
            ]
        }
    )

@app.delete("/delete_conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    result = db.delete_conversation(conversation_id)
    if result is not True:
        raise HTTPException(status_code=500, detail=result)
    return JSONResponse(
        status_code=200,
        content={
            "code": 200,
            "status": 1,
            "message": "Conversation deleted successfully",
            "data": {"conversation_id": conversation_id}
        }
    )


if __name__ == '__main__':
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
