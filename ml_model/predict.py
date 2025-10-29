from tensorflow import keras
from PIL import Image
import numpy as np
import sys

# Load model
model = keras.models.load_model("best_disaster_model.keras")
class_names = ["Cyclone", "Earthquake", "Flood", "Wildfire"]
IMG_SIZE = (224, 224)

def preprocess_image(img_path):
    img = Image.open(img_path).convert('RGB')
    img = img.resize(IMG_SIZE)
    img_array = np.expand_dims(np.array(img) / 255.0, axis=0)
    return img_array

if __name__ == "__main__":
    img_path = sys.argv[1]  # example: python predict.py sample.jpg
    img_array = preprocess_image(img_path)
    preds = model.predict(img_array)
    idx = np.argmax(preds[0])
    print(f"Prediction: {class_names[idx]} ({preds[0][idx]*100:.2f}%)")
