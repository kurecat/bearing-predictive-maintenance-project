from fastapi import FastAPI, Body
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient

def fix_objectid(document):
    if not document:
        return document
    document["_id"] = str(document["_id"])
    return document


app = FastAPI()

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client["bearing_predictive_maintenance"]

# 기본 엔드포인트
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

@app.post("/history")
async def create_history(data: dict = Body(...)):
    result = await db.history.insert_one(data)
    return {"message": "History created", "id": str(result.inserted_id)}

@app.get("/history")
async def get_history(id: str = None, model_name: str = None):
    if id:
        history = await db.history.find_one({"_id": id})
        return fix_objectid(history) if history else {"message": "History not found"}
    elif model_name:
        # motor_spec 안의 model 필드 검색
        history_list = await db.history.find({"motor_spec.model": model_name}).to_list(100)
        return [fix_objectid(history) for history in history_list]
    else:
        history_list = await db.history.find({}).to_list(100)
        return [fix_objectid(history) for history in history_list]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

    # pip install fastapi uvicorn motor
    # uvicorn main:app --reload
    # 으로 서버 실행