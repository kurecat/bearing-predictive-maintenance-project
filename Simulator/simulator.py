import os
import time
import threading
import csvToJsonPost

def collect_target_dirs(root_path):
    target_dirs = []
    for dirpath, dirnames, filenames in os.walk(root_path):
        # CSV 파일만 쏙쏙 골라냅니다
        csv_files = [f for f in filenames if f.endswith('.csv')]
        if not csv_files:
            continue
        
        # 💡 조건 완화: 'vibration'이라는 단어가 없어도 무조건 찾도록 수정!
        # (현재는 '정상' 데이터만 쏘도록 되어 있습니다. 고장 데이터도 쏘고 싶다면 if문을 지우시면 됩니다.)
        if "정상" in dirpath: 
            target_dirs.append((dirpath, sorted(csv_files)))
            
    return target_dirs

def process_file(dirpath, fname):
    rel_path = os.path.relpath(dirpath, root)
    
    # 💡 엔드포인트 고정: 폴더명에 vibration이 없더라도 무조건 진동 API로 쏘게 만듭니다.
    endpoint = "http://localhost:8000/api/upload/vibration"

    filepath = os.path.join(dirpath, fname)
    print(f"[{rel_path}] ➔ 서버로 발사 중! 🚀")
    
    try:
        csvToJsonPost.csv_to_json_post(filepath, endpoint)
    except Exception as e:
        print(f"⚠️ 처리 실패: {filepath}, 에러: {e}")

def folder_worker(dirpath, filenames, interval=5):
    """한 폴더의 파일들을 5초마다 하나씩 순환 처리"""
    idx = 0
    while True:
        fname = filenames[idx]
        process_file(dirpath, fname)
        time.sleep(interval)  
        idx = (idx + 1) % len(filenames)  

# 💡 최상위 경로를 우리가 복사해둔 D드라이브로 확정!
root = "G:/data" 
target_dirs = collect_target_dirs(root)

# 데이터가 없을 경우 친절하게 알려주기
if not target_dirs:
    print(f"❌ '{root}' 경로에서 '정상' 폴더를 찾지 못했습니다! 폴더 경로를 확인해주세요.")
    exit()

print(f"🎯 총 {len(target_dirs)}개의 데이터 폴더 장전 완료! 발사 시작!")

# 폴더별로 독립 스레드(일꾼) 실행
for dirpath, filenames in target_dirs:
    t = threading.Thread(target=folder_worker, args=(dirpath, filenames, 5))
    t.daemon = True
    t.start()

print("🔄 모든 폴더 스레드 실행 중 (무한 반복)")
while True:
    time.sleep(60)