# predictor.py
import numpy as np
from tensorflow.keras.models import load_model

# 서버 시작 시 모델 로드 (한 번만)
vibration_model = load_model("fault_detection_cnn.keras")

def predict(samples: list) -> list:
    """
    samples: 2D 리스트 (12000행, 2열)
    마지막 열만 사용해서 (12000, 1) 입력으로 변환
    """
    arr = np.array(samples)  # (12000, 2)
    last_col = arr[:, -1]    # 마지막 열만 추출 → (12000,)
    input_data = last_col.reshape(1, 12000, 1)  # 모델 입력 형태 맞추기
    prob = vibration_model.predict(input_data).tolist()[0]
    return prob