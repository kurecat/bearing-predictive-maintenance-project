from fastapi import FastAPI, UploadFile
import uvicorn
import numpy as np
from model import load_cnn_model
from preprocess import preprocess_csv

app = FastAPI()
model = load_cnn_model()

# 라벨 매핑
label_map = {0: "정상", 1: "베어링불량", 2: "회전체불평형", 3: "축정렬불량", 4: "벨트느슨함"}

# 기본 엔드포인트
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

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