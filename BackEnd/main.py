from fastapi import FastAPI, WebSocket
import numpy as np
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo import MongoClient
import uvicorn
from predictor import predict

# === MongoDB 연결 ===
client = MongoClient("mongodb://localhost:27017")
db = client["bearing_predictive_maintenance"]

devices_col = db["devices"]
current_rms_col = db["current_rms"]
current_samples_col = db["current_samples"]
current_metadata_col = db["current_metadata"]
vibration_rms_col = db["vibration_rms"]
vibration_samples_col = db["vibration_samples"]
vibration_metadata_col = db["vibration_metadata"]

active_connections = []

app = FastAPI()

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

# === 업로드 엔드포인트 (Current) ===
@app.post("/api/upload/current")
async def upload_current(data: UploadData):
    spec = parse_motor_spec(data.MotorSpec)
    device_ref = find_or_create_device(spec)

    rms_result = current_rms_col.insert_one({
        "device_ref": device_ref,
        "values": data.RMS
    })
    rms_id = rms_result.inserted_id

    samples_result = current_samples_col.insert_one({
        "device_ref": device_ref,
        "samples": data.Samples
    })
    samples_id = samples_result.inserted_id

    meta_result = current_metadata_col.insert_one({
        "device_ref": device_ref,
        "date": data.Date,
        "filename": data.Filename,
        "data_label": data.DataLabel,
        "label_no": data.LabelNo,
        "period": data.Period,
        "sample_rate": data.SampleRate,
        "data_length": data.DataLength,
        "rms_id": rms_id,
        "samples_id": samples_id
    })

    meta_doc = current_metadata_col.find_one({"_id": meta_result.inserted_id})
    await broadcast_event("current_data", meta_doc, data.RMS)

    return {"status": "ok", "metadata_id": str(meta_result.inserted_id)}

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
    probs = predict(data.Samples)
    prob = max(probs) if probs else None

    meta_result = vibration_metadata_col.insert_one({
        "device_ref": device_ref,
        "date": data.Date,
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

# === 조회 엔드포인트 (Current History) ===
@app.get("/api/devices/{device_id}/current")
def get_current_history(device_id: str):
    history = list(current_metadata_col.find({"device_ref": ObjectId(device_id)}))
    for h in history:
        h["_id"] = str(h["_id"])
        h["device_ref"] = str(h["device_ref"])
        h["rms_id"] = str(h["rms_id"])
        h["samples_id"] = str(h["samples_id"])
    return history

# RMS 조회
@app.get("/api/devices/{device_id}/current/rms")
def get_current_rms(device_id: str):
    docs = list(current_metadata_col.find({"device_ref": ObjectId(device_id)}))
    rms_values = [doc.get("rms") for doc in docs if "rms" in doc]
    return {"device_id": device_id, "rms": rms_values}

# Samples 조회
@app.get("/api/devices/{device_id}/current/samples")
def get_current_samples(device_id: str):
    docs = list(current_metadata_col.find({"device_ref": ObjectId(device_id)}))
    samples = [doc.get("samples") for doc in docs if "samples" in doc]
    return {"device_id": device_id, "samples": samples}

# === 조회 엔드포인트 (Vibration History) ===
@app.get("/api/devices/{device_id}/vibration")
def get_vibration_history(device_id: str):
    history = list(vibration_metadata_col.find({"device_ref": ObjectId(device_id)}))
    for h in history:
        h["_id"] = str(h["_id"])
        h["device_ref"] = str(h["device_ref"])
        h["rms_id"] = str(h["rms_id"])
        h["samples_id"] = str(h["samples_id"])
    return history

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