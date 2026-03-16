from tensorflow.keras.models import load_model

MODEL_PATH = "fault_detection_cnn.h5"

def load_cnn_model():
    model = load_model(MODEL_PATH)
    return model