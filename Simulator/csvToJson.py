import csv
import json

def csv_to_json_file(csv_path: str, json_path: str):
    """
    CSV 파일을 읽어서 UploadData 구조에 맞는 JSON 파일로 변환
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

        # 메타데이터 처리
        if parts[0].lower() == "date":
            meta["Date"] = parts[1]
        elif parts[0].lower() == "filename":
            meta["Filename"] = parts[1]
        elif parts[0].lower() == "data label":
            meta["DataLabel"] = parts[1] if len(parts) > 1 else None
        elif parts[0].lower() == "label no":
            meta["LabelNo"] = parts[1] if len(parts) > 1 else None
        elif parts[0].lower() == "motor spec":
            meta["MotorSpec"] = ",".join(parts[1:])
        elif parts[0].lower() == "period":
            meta["Period"] = parts[1]
        elif parts[0].lower() == "sample rate":
            meta["SampleRate"] = int(parts[1])
        elif parts[0].lower() == "rms":
            rms_values = [float(v) for v in parts[1:]]
        elif parts[0].lower() == "data length":
            meta["DataLength"] = int(parts[1])
        else:
            # 샘플 데이터 처리 (time, x, y, z)
            try:
                sample = [float(p) for p in parts]
                samples.append(sample)
            except ValueError:
                pass

    # 최종 JSON 구조
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

    # JSON 파일로 저장
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"✅ 변환 완료: {json_path}")


# === 사용 예시 ===
csv_to_json_file("input.csv", "output.json")