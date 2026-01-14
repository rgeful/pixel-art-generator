import os
import sys
import time
import base64
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
from vertexai.preview.vision_models import ImageGenerationModel
import vertexai

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
LOCATION = "us-west1"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MagicRequest(BaseModel):
    image: str
    category: str

@app.get("/test-api")
def test_api():
    """Test endpoint to verify Gemini API key is working"""
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents='Hello'
        )
        return {"status": "ok", "message": "Gemini API key is valid"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/magic-generate")
def magic_generate(request: MagicRequest):
    try:
        print(f"Analyzing sketch of a {request.category}")

        image_data = request.image.split(",")[1] if "," in request.image else request.image
        image_bytes = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_bytes))

        temp_input = "temp_input.png"
        pil_image.save(temp_input)

        vision_prompt = f"Describe this sketch in less than 30 words. It's a rough drawing of something that falls into this category: {request.category}. Focus on what you see, not that it's a sketch. Be concise and specific about key features."

        with open(temp_input, 'rb') as f:
            image_bytes_upload = f.read()

        vision_response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[
                types.Part.from_bytes(data=image_bytes_upload, mime_type='image/png'),
                vision_prompt
            ]
        )

        detected_clean = vision_response.text.strip()
        print(f"Detected: {detected_clean}")

        if os.path.exists(temp_input):
            os.remove(temp_input)

        print(f"Generating pixel art with Vertex AI (Imagen 3)...")

        final_prompt = (
            f"PIXEL ART ONLY: 16-bit retro video game sprite of {detected_clean}. "
            f"Style: Super Nintendo SNES pixel art sprite, exactly like Pokémon, Final Fantasy VI, Chrono Trigger sprites. "
            f"Visual style: Square blocky pixels in a visible grid, limited color palette (16-32 colors max), "
            f"flat solid color fills, high contrast colors, simple cel shading, sharp pixelated edges, retro game graphics. "
            f"Small sprite on plain solid background (beige or light gray), centered composition. "
            f"NOT A PHOTO. NOT REALISTIC. NOT 3D. NOT PAINTED. Only authentic retro pixel art video game style. "
            f"Must have clearly visible pixel blocks like old Nintendo games."
        )

        vertexai.init(project=PROJECT_ID, location=LOCATION)

        model = ImageGenerationModel.from_pretrained("imagegeneration@006")

        images = model.generate_images(
            prompt=final_prompt,
            number_of_images=1,
            aspect_ratio="1:1",
            safety_filter_level="block_some",
            person_generation="allow_adult"
        )

        temp_filename = "temp_generated.png"
        images[0].save(location=temp_filename, include_generation_parameters=False)

        with open(temp_filename, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            result_base64 = f"data:image/png;base64,{encoded_string}"

        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        print("Generation Complete")

        return {
            "result_url": result_base64,
            "detected_as": detected_clean
        }

    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))