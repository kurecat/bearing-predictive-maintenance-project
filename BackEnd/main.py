from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware  # 미들웨어 모듈 
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient

def fix_objectid(document):
    if not document:
        return document
    document["_id"] = str(document["_id"])
    return document


app = FastAPI()

# 미들웨어 설정 (프론트에서 백엔드로 접근할 수 있도록 허용하는 설정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인에서의 접근을 허용 (학습/개발 단계용)
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 등 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)


MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client["bearing_predictive_maintenance"]

# 기본 엔드포인트
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

# 저장된 센서 데이터 리스트 조회
@app.get("/sensor-data")
async def get_sensor_data():
    # 프론트엔드 차트나 테이블에서 사용할 샘플 데이터
    sample_data = [
        {"id": 1, "timestamp": "2024-03-20 10:00:01", "vibration": 0.52, "temperature": 35.4, "current": 1.2},
        {"id": 2, "timestamp": "2024-03-20 10:00:02", "vibration": 0.55, "temperature": 35.6, "current": 1.3},
    ]
    return {"status": "success", "data": sample_data}

# 과거 예측 이력 리스트 조회
@app.get("/prediction-history")
async def get_prediction_history():
    # 과거 진단 기록 페이지에서 사용할 샘플 데이터
    history_data = [
        {"id": 1, "date": "2024-03-19", "result": "정상", "confidence": 0.98},
        {"id": 2, "date": "2024-03-18", "result": "베어링불량", "confidence": 0.85},
    ]
    return {"status": "success", "data": history_data}

# 실시간 예측 리스트 조회
@app.get("/real-time-prediction")
async def get_real_time_prediction():
    # 대시보드 메인에서 보여줄 현재 상태 데이터
    real_time_status = {
        "motor_id": "MTR_001",
        "current_status": "정상",
        "last_update": "2024-03-20 15:30:45",
        "risk_level": "Low"
    }
    return {"status": "success", "data": real_time_status}

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

    # pip install fastapi uvicorn
    # uvicorn main:app --reload
    # 으로 서버 실행