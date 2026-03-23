import os
import time
import threading
import csvToJsonPost

def collect_normal_dirs(root_path):
    """'정상' 포함된 경로만 수집"""
    normal_dirs = []
    for dirpath, dirnames, filenames in os.walk(root_path):
        if not filenames:
            continue
        if "정상" in dirpath:
            normal_dirs.append((dirpath, sorted(filenames)))
    return normal_dirs

def process_file(dirpath, fname):
    rel_path = os.path.relpath(dirpath, root)
    if "current" in dirpath.lower():
        endpoint = "http://localhost:8000/api/upload/current"
    elif "vibration" in dirpath.lower():
        endpoint = "http://localhost:8000/api/upload/vibration"
    else:
        endpoint = None

    filepath = os.path.join(dirpath, fname)
    print(f"[{rel_path}] {filepath}")
    if endpoint:
        try:
            csvToJsonPost.csv_to_json_post(filepath, endpoint)
        except Exception as e:
            print(f"⚠️ 처리 실패: {filepath}, 에러: {e}")
    else:
        print(f"⚠️ 엔드포인트를 알 수 없음: {filepath}")

root = "e:/data_vibration"
normal_dirs = collect_normal_dirs(root)

folder_interval = 5  # 전체 처리 후 인터벌(초)
max_files = max(len(filenames) for _, filenames in normal_dirs)

# 파일 인덱스별 병렬 처리
for i in range(max_files):
    threads = []
    for dirpath, filenames in normal_dirs:
        if i < len(filenames):
            t = threading.Thread(target=process_file, args=(dirpath, filenames[i]))
            t.start()
            threads.append(t)
    # 모든 스레드 대기
    for t in threads:
        t.join()

    # 전체가 끝나면 인터벌
    print(f"⏸ {folder_interval}초 대기 후 다음 처리")
    time.sleep(folder_interval)

print("✅ 모든 파일 처리 완료")