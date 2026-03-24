import os
import time
import threading
import csvToJsonPost

def collect_normal_dirs(root_path):
    normal_dirs = []
    for dirpath, dirnames, filenames in os.walk(root_path):
        if not filenames:
            continue
        if "정상" in dirpath and "vibration" in dirpath:
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

def folder_worker(dirpath, filenames, interval=5):
    """한 폴더의 파일들을 순환 처리"""
    idx = 0
    while True:
        fname = filenames[idx]
        process_file(dirpath, fname)
        time.sleep(interval)  # 파일 간 대기
        idx = (idx + 1) % len(filenames)  # 마지막까지 가면 다시 첫 파일로

root = "e:/data"
normal_dirs = collect_normal_dirs(root)

# 폴더별로 독립 스레드 실행
for dirpath, filenames in normal_dirs:
    t = threading.Thread(target=folder_worker, args=(dirpath, filenames, 5))
    t.daemon = True
    t.start()

print("🔄 모든 폴더 스레드 실행 중 (무한 반복)")
while True:
    time.sleep(60)  # 메인 스레드는 계속 살아있게 유지