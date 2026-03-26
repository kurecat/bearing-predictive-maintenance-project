import os
import time
import random
import requests

# 💡 사용자님의 찐 데이터가 있는 경로
root_path = r"C:\Users\human\Desktop\1차 프로젝트\프로젝트 샘플 데이터\vibration\2.2kW\L-EF-04\정상"
endpoint = "http://localhost:8000/api/upload/vibration"

def get_csv_files(folder):
    """폴더 안의 모든 CSV 파일을 리스트로 가져옵니다."""
    csv_files = []
    for f in os.listdir(folder):
        if f.endswith('.csv'):
            csv_files.append(os.path.join(folder, f))
    return csv_files

def send_randomized_data(filepath):
    """
    원본 파일을 읽은 뒤, 진동값(Samples)에 랜덤 노이즈를 섞어서
    백엔드가 좋아하는 완벽한 JSON 규격으로 전송합니다.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.read().strip().splitlines()

    meta = {}
    rms_values = []
    samples = []

    for line in lines:
        parts = [p.strip() for p in line.split(",") if p.strip()]
        if not parts: continue
        
        key = parts[0].lower().replace("_", " ")

        if key == "date": meta["Date"] = parts[1]
        # 백엔드에 보낼 때 가짜 데이터임을 알 수 있게 이름 앞에 GEN_ 을 붙입니다
        elif key == "filename": meta["Filename"] = "GEN_" + parts[1]
        elif key == "data label": meta["DataLabel"] = parts[1] if len(parts) > 1 else None
        elif key == "label no": meta["LabelNo"] = parts[1] if len(parts) > 1 else None
        elif key == "motor spec": meta["MotorSpec"] = ",".join(parts[1:])
        elif key == "period": meta["Period"] = parts[1]
        elif key == "sample rate": meta["SampleRate"] = int(parts[1])
        elif key == "rms": 
            # 💡 기존 RMS 값에 -0.05 ~ +0.05 사이의 랜덤 변형 주기!
            rms_values = [max(0, float(v) + random.uniform(-0.05, 0.05)) for v in parts[1:]]
        elif key == "data length": meta["DataLength"] = int(parts[1])
        else:
            try:
                # 💡 핵심: 기존 센서 측정값(Samples)에 -0.1 ~ +0.1 사이의 무작위 노이즈 추가!
                # 이렇게 하면 기존 모터의 특징을 가지면서도 영원히 겹치지 않는 새 데이터가 됩니다.
                sample = [float(p) + random.uniform(-0.1, 0.1) for p in parts]
                samples.append(sample)
            except ValueError:
                pass

    # 백엔드(FastAPI)가 정확히 기다리고 있는 규격으로 포장
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

    try:
        # 💡 핵심 포인트: data= 대신 json= 을 사용해야 422 에러가 박멸됩니다!
        response = requests.post(endpoint, json=result)
        if response.status_code == 200:
            print(f"[✅ 전송 성공] 🧬 랜덤 변형 데이터 발사! ➔ 응답: {response.status_code}")
        else:
            print(f"[⚠️ 전송 실패] ➔ 응답: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"[❌ 서버 접속 실패] 백엔드가 켜져있는지 확인하세요! 에러: {e}")

if __name__ == "__main__":
    files = get_csv_files(root_path)
    if not files:
        print(f"❌ '{root_path}' 경로에서 파일을 찾지 못했습니다!")
        exit()
        
    print(f"🎯 총 {len(files)}개의 원본 파일을 기반으로 🧬랜덤 변형 데이터🧬 생성을 시작합니다!")
    print("🔄 1초마다 백엔드로 쉴 새 없이 전송합니다... (종료하려면 Ctrl+C)")
    
    while True:
        # 1. 원본 파일 중 아무거나 하나 랜덤으로 뽑기
        random_file = random.choice(files)
        # 2. 값에 무작위 변형을 가해서 서버로 전송!
        send_randomized_data(random_file)
        # 3. 1초 휴식 (너무 빠르면 숫자를 늘려주세요)
        time.sleep(1)