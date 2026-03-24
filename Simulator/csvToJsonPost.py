import csv
import json
import requests

def csv_to_json_post(csv_path: str, url: str):
    """
    CSV 파일을 읽어서 UploadData 구조에 맞는 JSON으로 변환 후 POST 요청
    """
    with open(csv_path, "r", encoding="utf-8") as f:
        lines = f.read().strip().splitlines()

    meta = {}
    rms_values = []
    samples = []

    for line in lines:
        parts = [p.strip() for p in line.split(",") if p.strip()]
        if not parts:
            continue

        # 첫 번째 키를 소문자로 바꾸고, 언더바를 공백으로 치환
        key = parts[0].lower().replace("_", " ")

        if key == "date":
            meta["Date"] = parts[1]
        elif key == "filename":
            meta["Filename"] = parts[1]
        elif key == "data label":
            meta["DataLabel"] = parts[1] if len(parts) > 1 else None
        elif key == "label no":
            meta["LabelNo"] = parts[1] if len(parts) > 1 else None
        elif key == "motor spec":
            meta["MotorSpec"] = ",".join(parts[1:])
        elif key == "period":
            meta["Period"] = parts[1]
        elif key == "sample rate":
            meta["SampleRate"] = int(parts[1])
        elif key == "rms":
            rms_values = [float(v) for v in parts[1:]]
        elif key == "data length":
            meta["DataLength"] = int(parts[1])
        else:
            try:
                sample = [float(p) for p in parts]
                samples.append(sample)
            except ValueError:
                pass


    result = {
        "Date": meta.get("Date"),
        "Filename": meta.get("Filename"),
        "DataLabel": meta.get("DataLabel"),
        "LabelNo": meta.get("LabelNo"),
        "MotorSpec": meta.get("MotorSpec"),
        "Period": meta.get("Period"),
        "SampleRate": meta.get("SampleRate"),
        "RMS": rms_values,
        "DataLength": meta.get("DataLength"),
        "Samples": samples
    }

    # POST 요청
    response = requests.post(url, json=result)
    print(f"✅ POST 완료: {url}, 응답 코드={response.status_code}")
    try:
        print("응답:", response.json())
    except Exception:
        print("응답 텍스트:", response.text)