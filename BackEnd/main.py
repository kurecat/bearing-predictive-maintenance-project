from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo import MongoClient
import uvicorn

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
    alias: str = "0"

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
    data_label: Optional[str] = None
    label_no: Optional[str] = None
    period: str
    sample_rate: int
    data_length: int
    rms_id: str
    samples_id: str

class UploadData(BaseModel):
    Date: str
    Filename: str
    DataLabel: Optional[str] = None
    LabelNo: Optional[str] = None
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
        result = devices_col.insert_one({
            "motor_spec": spec,
            "alias": "0"
        })
        return result.inserted_id

# === 업로드 엔드포인트 (Current) ===
@app.post("/api/upload/current")
def upload_current(data: UploadData):
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

    return {"status": "ok", "metadata_id": str(meta_result.inserted_id)}

# === 업로드 엔드포인트 (Vibration) ===
@app.post("/api/upload/vibration")
def upload_vibration(data: UploadData):
    spec = parse_motor_spec(data.MotorSpec)
    device_ref = find_or_create_device(spec)

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
        "samples_id": samples_id
    })

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

# === 실행 엔트리포인트 ===
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# pip install fastapi uvicorn pymongo
# uvicorn main:app --reload --host 0.0.0.0 --port 8000