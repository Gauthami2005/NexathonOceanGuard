# model_service/app.py - Fixed version without PIL imports

from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model config
CLASS_NAMES = ["Cyclone", "Earthquake", "Flood", "Wildfire"]

print("🚀 Model service running with verify-hazard endpoint")

# 🔹 Compute text-image authenticity match
def compute_text_match_score(title, predicted_label):
    if not title or not predicted_label:
        return 0
    t = title.lower()
    p = predicted_label.lower()
    return 1 if (t in p or p in t) else 0

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Model service is running", "status": "healthy"}

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "model_service"}

# 🔹 API endpoint for verification
@app.post("/verify-hazard")
async def verify_hazard(
    title: str = Form(...),
    description: str = Form(None),
    type: str = Form(None),
    location: str = Form(None),
    pincode: str = Form(None),
    image: UploadFile = File(None)  # Changed to handle file uploads
):
    try:
        # Mock prediction since ML model is not available
        predicted_label = "Flood"  # Mock prediction
        confidence = 0.85  # Mock confidence
        
        # Check if image was uploaded
        image_info = None
        if image and image.filename:
            image_info = {
                "filename": image.filename,
                "content_type": image.content_type,
                "size": image.size if hasattr(image, 'size') else "unknown"
            }
            # For now, we'll use mock prediction based on image presence
            # In a real implementation, you would process the image here
            predicted_label = "Flood"  # Mock prediction based on image
            confidence = 0.90  # Higher confidence when image is present
        
        # basic hazard threshold
        is_hazard = confidence >= 0.1

        # authenticity check between title and model label
        match_score = compute_text_match_score(title, predicted_label)
        authenticity = True if (is_hazard and match_score == 1 and confidence >= 0.8) else False

        components = {
            "probabilities": {CLASS_NAMES[i]: 0.25 for i in range(len(CLASS_NAMES))},  # Mock equal probabilities
            "image_info": image_info,
            "note": "Mock prediction - ML model not available"
        }

        return {
            "isHazard": is_hazard,
            "authenticity": authenticity,
            "confidence": confidence,
            "predictedLabel": predicted_label,
            "components": components
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)