# AI Image Protocol: Forensic Detection Engine


### 🚀 Overview
**AI Image Protocol** is a professional-grade forensic analysis platform designed to distinguish between authentic photography and synthetic AI-generated imagery. Featuring a hybrid dual-engine architecture and interactive forensic tools, it provides deep insights into the integrity of digital media.

### ✨ Key Features
*   **Dual-Inference Architecture:**
    *   **M1 Engine:** Client-side Zero-Shot CLIP analysis using `@xenova/transformers`.
    *   **M2 Engine (Optimized):** Server-side ResNet-50 CNN (PyTorch) with **Test Time Augmentation (TTA)** for extreme accuracy.
*   **Interactive Inspect Mode:**
    *   **Neural Magnifier:** Real-time 2x zoom with a digital wireframe HUD.
    *   **Patch Integrity Analysis:** Calculates "Neural Consistency" scores for specific image regions.
*   **Explainable AI (XAI):** Generates occlusion heatmaps to visualize exactly where the model detected AI artifacts.
*   **Aesthetic UI:** Premium dark-mode interface built with Next.js, Framer Motion, and Tailwind CSS.

### 🛠️ Tech Stack
*   **Frontend:** Next.js 15, React 19, Tailwind CSS, Framer Motion
*   **ML Engines:** PyTorch (Backend), TensorFlow.js (Frontend), Transformers.js
*   **Backend:** Flask (Python), torchvision

### ⚙️ Installation

#### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-image-detector.git
cd ai-image-detector
```

#### 2. Install Web Dependencies
```bash
npm install
```

#### 3. Setup Python Backend
```bash
pip install torch torchvision flask flask-cors pillow
python api/main.py
```

#### 4. Run Development Server
```bash
npm run dev
```

### 📈 Future Roadmap
- [ ] Multi-engine source attribution (Midjourney, DALL-E, Grok).
- [ ] Metadata forensic scraping layer.
- [ ] Batch processing for bulk image verification.

---
*Created with ❤️ for the AI Forensic community.*
