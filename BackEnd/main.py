from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware  # 미들웨어 모듈 
import uvicorn
import numpy as np
from model import load_cnn_model
from preprocess import preprocess_csv

app = FastAPI()

# 미들웨어 설정 (프론트에서 백엔드로 접근할 수 있도록 허용하는 설정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인에서의 접근을 허용 (학습/개발 단계용)
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 등 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

model = load_cnn_model()

# 라벨 매핑
label_map = {0: "정상", 1: "베어링불량", 2: "회전체불평형", 3: "축정렬불량", 4: "벨트느슨함"}

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

# 업로드 엔드포인트
@app.post("/upload")
async def upload_data():
    id = 1
    return {"message": f"데이터 업로드됨, id : {id}"}

@app.post("/predict")
async def predict(file: UploadFile):
    # 업로드된 CSV 파일 저장
    file_path = f"./temp_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 전처리
    X_input = preprocess_csv(file_path)

    # 예측
    pred = model.predict(X_input)
    pred_class = np.argmax(pred, axis=1)[0]
    result = label_map[pred_class]

    return {"prediction": result, "probabilities": pred.tolist()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

    # pip install fastapi uvicorn
    # uvicorn main:app --reload
    # 으로 서버 실행