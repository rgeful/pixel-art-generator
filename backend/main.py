import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

@app.post("/magic-generate")
def magic_generate(request: MagicRequest):
    try:
        print(f"Analyzing sketch of a {request.category}")

        vision_response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Describe this sketch in less than 30 words. It's a rough drawing of something that falls into this category: {request.category}. Focus on what you see, not that it's a sketch. Be concise and specific about key features."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": request.image
                            }
                        }
                    ]
                }
            ],
            max_tokens=50
        )

        detected_clean = vision_response.choices[0].message.content.strip()
        print(f"Detected: {detected_clean}")

        print(f"Generating pixel art...")

        final_prompt = (
            f"A single centered 16-bit pixel art image of {detected_clean}. "
            f"Style: {request.category}, retro video game asset, SNES/Game Boy Advance style. "
            f"Features: chunky visible pixels, limited color palette, vibrant colors, clean edges, "
            f"simple shading, solid colors, no gradients, no anti-aliasing, no dithering. "
            f"Plain solid white background, single sprite only, no UI elements, no extra objects, centered composition."
        )

        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )

        result_url = response.data[0].url

        return {
            "result_url": result_url,
            "detected_as": detected_clean
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))