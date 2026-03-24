# predictor.py
import numpy as np
import pandas as pd
import joblib
from scipy import stats

# 서버 시작 시 모델 로드 (한 번만)
vibration_model = joblib.load("motor_fault_model.pkl")

def extract_features(signal: np.ndarray, power_kw: float) -> np.ndarray:
    """
    signal: 1D numpy array (예: 12000 샘플)
    power_kw: 모터 스펙에서 가져온 값
    학습 당시와 동일한 7개 특징을 반환
    """
    rms       = float(np.sqrt(np.mean(signal ** 2)))
    std       = float(np.std(signal))
    peak2peak = float(np.max(signal) - np.min(signal))
    kurtosis  = float(stats.kurtosis(signal))
    crest_factor = float(np.max(np.abs(signal)) / (rms + 1e-9))
    skewness  = float(stats.skew(signal))

    features = np.array([rms, std, peak2peak, kurtosis, crest_factor, skewness, power_kw])
    return features.reshape(1, -1)

def predict(samples: list, power_kw: float) -> list:
    arr = np.array(samples)
    last_col = arr[:, -1]
    input_data = extract_features(last_col, power_kw)

    # 학습 당시 feature 이름과 동일하게 지정
    feature_names = ["rms", "std", "peak2peak", "kurtosis", "crest_factor", "skewness", "power_kw"]
    df_input = pd.DataFrame(input_data, columns=feature_names)

    prob = vibration_model.predict_proba(df_input).tolist()[0]
    return prob