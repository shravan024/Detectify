import os
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import io

# Import model architecture
from models_arch import get_resnet50_baseline

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Next.js

# Device setup
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Server using device: {device}")

# Load the model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "resnet50.pth")
model = get_resnet50_baseline(num_classes=2, pretrained=False)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

# Image Preprocessing using standard ImageNet stats
transform_orig = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

transform_flip = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.RandomHorizontalFlip(p=1.0),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files["image"]
    image_bytes = file.read()
    
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
    
    # 🚀 Optimization: Test Time Augmentation (TTA)
    # Predicting on both original and flipped images for higher robustness
    t1 = transform_orig(image).unsqueeze(0).to(device)
    t2 = transform_flip(image).unsqueeze(0).to(device)
    input_batch = torch.cat([t1, t2])
    
    # Inference using modern Inference Mode
    with torch.inference_mode():
        logits = model(input_batch)
        probs = torch.softmax(logits, dim=1)
        
        # Average results over TTA passes
        avg_probs = probs.mean(dim=0)
        
        # Labels: [fake, real]
        prob_fake = avg_probs[0].item()
        prob_real = avg_probs[1].item()
    
    # Final verdict logic
    is_ai = prob_fake > prob_real
    confidence = round(max(prob_real, prob_fake) * 100, 2)
    
    # Certainty level (Standard 0.5 threshold)
    certainty = "High" if confidence > 85 else "Medium" if confidence > 65 else "Low"
    
    return jsonify({
        "isAI": is_ai,
        "confidence": confidence,
        "certainty": certainty,
        "details": {
            "real_probability": round(prob_real, 4),
            "fake_probability": round(prob_fake, 4)
        },
        "engine": "M2 Optimized/ResNet-50-TTA"
    })

if __name__ == "__main__":
    # Start the server on port 5001 to avoid conflicts
    app.run(host="0.0.0.0", port=5001)
