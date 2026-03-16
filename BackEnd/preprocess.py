import numpy as np
from sklearn.preprocessing import StandardScaler
import pandas as pd

def preprocess_csv(file_path):
    # 센서 데이터만 읽기
    df = pd.read_csv(file_path, skiprows=9, header=None)
    df = df.iloc[:, :-1]
    df.columns = ["time", "x", "y", "z"]

    # 스케일링
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[["x", "y", "z"]])

    # (2000, 3) 형태로 변환
    return X_scaled.reshape(1, 2000, 3)  # 배치 차원 추가