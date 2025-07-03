import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [blocks, setBlocks] = useState([]);
  const [spiral, setSpiral] = useState({ x: 0, y: 0, dir: "right", maxX: 1, maxY: 1 });
  const [error, setError] = useState(null);

  // Load existing blocks from API on mount
  useEffect(() => {
    fetch("https://localhost:44367/blocks")
      .then((res) => res.json())
      .then((fetchedBlocks) => {
        setBlocks(fetchedBlocks);

        if (fetchedBlocks.length > 0) {
          const last = fetchedBlocks[fetchedBlocks.length - 1];
          const x = last.position.x;
          const y = last.position.y;
          const maxX = Math.max(...fetchedBlocks.map(b => b.position.x));
          const maxY = Math.max(...fetchedBlocks.map(b => b.position.y));

          let dir;
          if (x < maxX) dir = "right";
          else if (y < maxY) dir = "down";
          else if (x > 0) dir = "left";
          else dir = "right"; // completed layer, start next

          setSpiral({ x, y, dir, maxX: Math.max(maxX, 1), maxY: Math.max(maxY, 1) });
        }
      })
      .catch((err) => setError("Could not load blocks: " + err));
  }, []);

  const addBlock = async () => {
    if (blocks.length === 0) {
      const newColor = getRandomColor();
      const newPosition = { x: 0, y: 0 };
      const newBlock = { position: newPosition, color: newColor };

      try {
        const response = await fetch("https://localhost:44367/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBlock),
        });
        if (!response.ok) throw new Error(await response.text());

        const savedBlock = await response.json();
        setBlocks([...blocks, savedBlock]);
      } catch (e) {
        setError("Could not add block: " + e.message);
      }
      return;
    }

    const lastColor = blocks.length > 0 ? blocks[blocks.length - 1].color : "";
    let newColor;
    do {
      newColor = getRandomColor();
    } while (newColor === lastColor);

    const nextSpiral = getNextSpiralStep(spiral);
    setSpiral(nextSpiral);

    const newPosition = { x: nextSpiral.x, y: nextSpiral.y };
    const newBlock = { position: newPosition, color: newColor };

    try {
      const response = await fetch("https://localhost:44367/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBlock),
      });
      if (!response.ok) throw new Error(await response.text());

      const savedBlock = await response.json();
      setBlocks([...blocks, savedBlock]);
    } catch (e) {
      setError("Could not add block: " + e.message);
    }
  };

  const clearBlocks = async () => {
    try {
      const response = await fetch("https://localhost:44367/blocks", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await response.text());

      setBlocks([]); // clear local state
      setSpiral({ x: 0, y: 0, dir: "right", maxX: 1, maxY: 1 }); // reset spiral state
    } catch (e) {
      setError("Could not clear blocks: " + e.message);
    }
  };

  return (
    <div className="app">
      <h1>Lägg till ruta</h1>
      <button onClick={addBlock}>Lägg till ruta</button>
      <button onClick={clearBlocks}>Rensa rutor</button>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        {blocks.map((b, idx) => (
          <div
            key={idx}
            className="block"
            style={{
              backgroundColor: b.color,
              left: `${(b.position.x + 1) * 54}px`,
              top: `${(b.position.y + 1) * 54}px`,
            }}
            title={`Pos: (${b.position.x}, ${b.position.y}) Color: ${b.color}`}
          />
        ))}
      </div>
    </div>
  );
}

function getNextSpiralStep({ x, y, dir, maxX, maxY }) {
  switch (dir) {
    case "right":
      if (x < maxX) return { x: x + 1, y, dir: "right", maxX, maxY };
      return { x, y: y + 1, dir: "down", maxX, maxY };
    case "down":
      if (y < maxY) return { x, y: y + 1, dir: "down", maxX, maxY };
      return { x: x - 1, y, dir: "left", maxX, maxY };
    case "left":
      if (x > 0) return { x: x - 1, y, dir: "left", maxX, maxY };
      // Finished a layer → add new column by increasing maxX, also extend maxY
      return { x: maxX + 1, y: 0, dir: "right", maxX: maxX + 1, maxY: maxX + 1 };
    default:
      throw new Error("Invalid direction");
  }
}

function getRandomColor() {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${hex}`;
}



export default App;