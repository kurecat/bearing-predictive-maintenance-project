from fastapi import FastAPI
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

app = FastAPI()

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client["bearing_predictive_maintenance"]

# 기본 엔드포인트
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

@app.patch("/history")
async def update_history(id: int, data: dict):
    result = await db.history.update_one({"_id": id}, {"$set": data})
    if result.modified_count > 0:
        return {"message": "History updated successfully"}
    else:
        return {"error": "History not found or no changes made"}

@app.get("/history")
async def get_history_list():
    history_list = await db.history.find({}, {"_id": 1, "timestamp": 1}).to_list(100)
    return history_list

@app.get("/history/{id}")
async def get_history_by_id(id: int):
    history = await db.history.find_one({"_id": id})
    if history:
        return history
    else:
        return {"error": "History not found"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

    # pip install fastapi uvicorn
    # uvicorn main:app --reload
    # 으로 서버 실행