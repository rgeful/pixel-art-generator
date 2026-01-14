"use client";
import { useState, useRef } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import axios from "axios";

const CATEGORIES = [
  "Character",    // People, heroes, NPCs
  "Creature",     // Animals, monsters, fantasy beasts
  "Object",       // Items, tools, weapons, collectibles
  "Food",         // Meals, ingredients, drinks
  "Environment",  // Buildings, landscapes, tiles
  "Icon"          // UI elements, symbols, small graphics
];

export default function Home() {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [category, setCategory] = useState("Character");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!canvasRef.current) return;
    setLoading(true);
    setResult(null);

    try {
      const dataUrl = await canvasRef.current.exportImage("png");

      const response = await axios.post("http://localhost:8000/magic-generate", {
        image: dataUrl,
        category: category,
      });

      setResult(response.data.result_url);
    } catch (error) {
      console.error("Error generating:", error);
      alert("Something went wrong. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  const clearCanvas = () => {
    canvasRef.current?.clearCanvas();
    setResult(null);
  };

  return (
    <main className="min-h-screen bg-neutral-800 text-white flex flex-col items-center py-10">
      <h1 className="text-6xl mb-6" style={{ textShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}>Pixel Art Generator</h1>

      <div className="flex gap-4 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full transition hover:scale-110 ${
              category === cat
                ? "bg-green-500 text-white scale-110"
                : "bg-neutral-600 text-neutral-200 hover:bg-neutral-700"
            }`}
            style={{ boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-8 items-start flex-wrap justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-4 rounded-lg overflow-hidden" style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)' }}>
            <ReactSketchCanvas
              ref={canvasRef}
              style={{ width: "600px", height: "600px" }}
              strokeWidth={4}
              strokeColor="black"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={clearCanvas}
              className="px-6 py-2 bg-neutral-700 rounded-lg hover:bg-neutral-600"
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {(result || loading) && (
          <div className="w-150 h-150 flex items-center justify-center bg-neutral-800 rounded-lg border-4 border-neutral-700 p-6" style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)' }}>
            {loading ? (
              <div className="animate-pulse text-2xl text-neutral-400">Generating...</div>
            ) : (
              <div className="text-center flex items-center justify-center w-full h-full">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result!} alt="Pixel Art" className="rounded-lg object-contain max-w-full max-h-full" style={{imageRendering: 'pixelated', boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.6)'}} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}