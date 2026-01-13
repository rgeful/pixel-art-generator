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
  const [detected, setDetected] = useState<string | null>(null);

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
      setDetected(response.data.detected_as);
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
    setDetected(null);
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-white flex flex-col items-center py-10">
      <h1 className="text-6xl mb-6">Pixel Art Generator</h1>

      <div className="flex gap-4 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full transition ${
              category === cat
                ? "bg-neutral-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-8 items-start flex-wrap justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-4 rounded-lg overflow-hidden shadow-2xl">
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
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {(result || loading) && (
          <div className="w-[600px] h-[600px] flex items-center justify-center bg-neutral-800 rounded-lg border border-neutral-700 p-4">
            {loading ? (
              <div className="animate-pulse text-2xl text-neutral-400">Generating...</div>
            ) : (
              <div className="text-center flex flex-col items-center gap-2">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result!} alt="Pixel Art" className="rounded-lg shadow-lg max-w-full max-h-[550px] object-contain" style={{imageRendering: 'pixelated'}} />
                <p className="text-xl text-neutral-300">AI saw: &quot;{detected}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}