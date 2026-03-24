from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo import MongoClient
import uvicorn
from predictor import predict
from datetime import datetime
import logging

logger = logging.getLogger("uvicorn")  # uvicorn 기본 로거 사용

# === MongoDB 연결 ===
client = MongoClient("mongodb://localhost:27017")
db = client["bearing_predictive_maintenance"]

# capped collection 생성 (최대 1000개 문서)
collections = [
    "devices",
    "vibration_rms",
    "vibration_samples",
    "vibration_metadata",
    "analyze_results",
]

for col in collections:
    # 기존 컬렉션 삭제 (주의: 데이터 사라짐)
    db.drop_collection(col)
    # capped collection 생성
    db.create_collection(
        col,
        capped=True,
        size=5242880,  # 최소 크기 (바이트 단위, 예시로 5MB)
        max=1000       # 최대 문서 수
    )
    print(f"Created capped collection '{col}' with max 1000 documents.")

# 컬렉션 핸들러 준비
devices_col = db["devices"]
vibration_rms_col = db["vibration_rms"]
vibration_samples_col = db["vibration_samples"]
vibration_metadata_col = db["vibration_metadata"]
analyze_results_col = db["analyze_results"]

# 연결 관리용 리스트
active_connections = []

# FastAPI 앱 초기화
app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # 허용할 출처
    allow_credentials=True,
    allow_methods=["*"],            # 허용할 HTTP 메서드
    allow_headers=["*"],            # 허용할 헤더
)


# === 데이터 모델 정의 ===
class MotorSpec(BaseModel):
    model: str
    rpm: int
    power_kw: float
    pole: float

class Device(BaseModel):
    _id: Optional[str]
    motor_spec: MotorSpec
    alias: str

class RMS(BaseModel):
    _id: Optional[str]
    device_ref: str
    values: List[float]

class Samples(BaseModel):
    _id: Optional[str]
    device_ref: str
    samples: List[List[float]]

class Metadata(BaseModel):
    _id: Optional[str]
    device_ref: str
    date: str
    filename: str
    data_label: Optional[str]
    label_no: Optional[str]
    period: str
    sample_rate: int
    data_length: int
    rms_id: str
    samples_id: str
    prob: Optional[float] = None
    probs: Optional[List[float]] = None

class UploadData(BaseModel):
    Date: str
    Filename: str
    DataLabel: Optional[str]
    LabelNo: Optional[str]
    MotorSpec: str
    Period: str
    SampleRate: int
    RMS: List[float]
    DataLength: int
    Samples: List[List[float]]

# === 유틸 ===
def parse_motor_spec(spec_str: str) -> Dict[str, Any]:
    parts = [p for p in spec_str.split(",") if p]
    return {
        "model": parts[0],
        "rpm": int(parts[1]),
        "power_kw": float(parts[2]),
        "pole": float(parts[3])
    }

def find_or_create_device(spec: Dict[str, Any]) -> ObjectId:
    existing = devices_col.find_one({"motor_spec": spec})
    if existing:
        return existing["_id"]
    else:
        # MotorSpec 필드들을 조합해서 alias 생성
        alias = spec['model']

        result = devices_col.insert_one({
            "motor_spec": spec,
            "alias": alias
        })
        return result.inserted_id
    
async def broadcast_event(event: str, device: dict, meta: dict, rms_values: list):
    payload = {
        "event": event,
        "payload": {
            "device": {
                "_id": str(device["_id"]),
                "motor_spec": device["motor_spec"],
                "alias": device.get("alias"),
            },
            "metadata": {
                "_id": str(meta["_id"]),
                "device_ref": str(meta["device_ref"]),
                "date": meta["date"],
                "filename": meta["filename"],
                "data_label": meta.get("data_label"),
                "label_no": meta.get("label_no"),
                "period": meta["period"],
                "sample_rate": meta["sample_rate"],
                "data_length": meta["data_length"],
                "prob": meta["prob"],
                "probs": meta["probs"],
                "rms_id": str(meta["rms_id"]),
                "samples_id": str(meta["samples_id"]),
            },
            "rms": rms_values,
        },
    }
    for conn in active_connections:
        await conn.send_json(payload)

# === 업로드 엔드포인트 (Vibration) ===
@app.post("/api/upload/vibration")
async def upload_vibration(data: UploadData):
    spec = parse_motor_spec(data.MotorSpec)
    device_ref = find_or_create_device(spec)
    device = devices_col.find_one({"_id": device_ref})

    rms_result = vibration_rms_col.insert_one({
        "device_ref": device_ref,
        "values": data.RMS
    })
    rms_id = rms_result.inserted_id

    samples_result = vibration_samples_col.insert_one({
        "device_ref": device_ref,
        "samples": data.Samples
    })
    samples_id = samples_result.inserted_id

    # === 모델 추론 호출 ===
    probs = predict(data.Samples, device["motor_spec"]["power_kw"])
    prob = max(probs[1:]) if probs else None

    meta_result = vibration_metadata_col.insert_one({
        "device_ref": device_ref,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "filename": data.Filename,
        "data_label": data.DataLabel,
        "label_no": data.LabelNo,
        "period": data.Period,
        "sample_rate": data.SampleRate,
        "data_length": data.DataLength,
        "rms_id": rms_id,
        "samples_id": samples_id,
        "prob": prob,
        "probs": probs
    })

    meta_doc = vibration_metadata_col.find_one({"_id": meta_result.inserted_id})
    await broadcast_event("vibration_data", device, meta_doc, data.RMS)

    return {"status": "ok", "metadata_id": str(meta_result.inserted_id)}


# === 조회 엔드포인트 (Devices) ===
@app.get("/api/devices")
def get_devices():
    devices = list(devices_col.find({}, {"motor_spec": 1, "alias": 1}))
    for d in devices:
        d["_id"] = str(d["_id"])
    return devices

# === 조회 엔드포인트 (Vibration History) ===
@app.get("/api/devices/{device_id}/vibration")
def get_vibration_history(device_id: str):
    history = list(vibration_metadata_col.find({"device_ref": ObjectId(device_id)}))
    results = []
    for meta in history:
        device = devices_col.find_one({"_id": meta["device_ref"]})
        rms_doc = vibration_rms_col.find_one({"_id": meta["rms_id"]})
        rms_values = rms_doc["values"] if rms_doc else []

        results.append({
            "device": {
                "_id": str(device["_id"]),
                "motor_spec": device["motor_spec"],
                "alias": device.get("alias"),
            },
            "metadata": {
                "_id": str(meta["_id"]),
                "device_ref": str(meta["device_ref"]),
                "date": meta["date"],
                "filename": meta["filename"],
                "data_label": meta.get("data_label"),
                "label_no": meta.get("label_no"),
                "period": meta["period"],
                "sample_rate": meta["sample_rate"],
                "data_length": meta["data_length"],
                "prob": meta["prob"],
                "probs": meta["probs"],
                "rms_id": str(meta["rms_id"]),
                "samples_id": str(meta["samples_id"]),
            },
            "rms": rms_values,
        })
    return results

# RMS 조회
@app.get("/api/devices/{device_id}/vibration/rms")
def get_vibration_rms(device_id: str):
    docs = list(vibration_metadata_col.find({"device_ref": ObjectId(device_id)}))
    rms_values = [doc.get("rms") for doc in docs if "rms" in doc]
    return {"device_id": device_id, "rms": rms_values}

# Samples 조회
@app.get("/api/devices/{device_id}/vibration/samples")
def get_vibration_samples(device_id: str):
    docs = list(vibration_metadata_col.find({"device_ref": ObjectId(device_id)}))
    samples = [doc.get("samples") for doc in docs if "samples" in doc]
    return {"device_id": device_id, "samples": samples}

@app.post("/api/analyze/vibration")
async def analyze_vibration(data: UploadData):
    spec = parse_motor_spec(data.MotorSpec)
    probs = predict(data.Samples, spec["power_kw"])
    prob = max(probs[1:]) if probs else None

    # 상태 판정 로직 (생략: 기존 코드 그대로)
    if prob is None:
        status = "분석 불가"
        status_color = "#9ca3af"  # 회색
        alarm = "데이터가 부족하여 분석할 수 없습니다."
        guide = "데이터를 다시 확인하세요."
    elif prob <= 0.3:
        status = "정상: 특이사항 없음"
        status_color = "#10b981"  # 초록
        alarm = "안정적인 상태를 유지하고 있습니다."
        guide = "지속적인 모니터링 수행"
    elif prob < 0.7:
        status = "주의: 이상 진동 패턴 감지"
        status_color = "#f59e0b"  # 주황
        alarm = "현 추세 유지 시 점검이 필요합니다."
        guide = "설비 체결 상태 확인 및 정밀 진단 권장"
    else:
        status = "고장: 심각한 이상 감지"
        status_color = "#ef4444"  # 빨강
        alarm = "즉각적인 점검 및 조치가 필요합니다."
        guide = "설비를 즉시 정지하고 정밀 진단 수행"
    
    # FFT 계산
    samples = np.array(data.Samples)
    vibration_vals = samples[:, 1]
    fft_vals = np.fft.rfft(vibration_vals)
    fft_freqs = np.fft.rfftfreq(len(vibration_vals), d=0.00025)

    # 진폭 계산
    amplitudes = np.abs(fft_vals)

    # 상위 10개 피크만 추출
    top_indices = np.argsort(amplitudes)[-10:][::-1]  # 큰 값부터 정렬
    fftData = [
    {"freq": f"{round(fft_freqs[i], 2)}Hz", "amplitude": float(amplitudes[i])}
    for i in top_indices
    ]

    response_doc = {
        "statusColor": status_color,
        "summary": {
            "status": status,
            "probability": int(prob * 100) if prob is not None else None,
            "alarm": alarm,
            "guide": guide,
            "filename": data.Filename,
            "rms": data.RMS[0] if data.RMS else None,
            "label": data.DataLabel,
            "motorSpec": data.MotorSpec,
        },
        "waveformData": [{"time": s[0], "vibration": s[1]} for s in data.Samples[:200]],
        "fftData": fftData,
        "healthTrend": [{"day": f"D-{14-i}", "score": 95 - i*2} for i in range(14)],
        "featureImportance": [
            {"subject": "수평 진동 (X)", "A": 20, "fullMark": 100},
            {"subject": "수직 진동 (Y)", "A": 15, "fullMark": 100},
            {"subject": "축방향 진동 (Z)", "A": 25, "fullMark": 100},
            {"subject": "온도 편차", "A": 30, "fullMark": 100},
            {"subject": "고주파 소음", "A": 10, "fullMark": 100},
        ]
    }

    result = analyze_results_col.insert_one(response_doc)
    response_doc["_id"] = str(result.inserted_id)

    return response_doc


    result = analyze_results_col.insert_one(response_doc)
    response_doc["_id"] = str(result.inserted_id)

    return response_doc


@app.websocket("/socket/devices")
async def device_socket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print("Client says:", data)
    except Exception:
        active_connections.remove(websocket)

# === 실행 엔트리포인트 ===
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# pip install fastapi "uvicorn[standard]" pymongo
# uvicorn main:app --reload --host 0.0.0.0 --port 8000