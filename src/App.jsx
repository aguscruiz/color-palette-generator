import React, { useState, useEffect } from 'react';
import PaletteRow from './components/PaletteRow';
import { randomColor, hexToOklch } from './utils/color';

const STORAGE_KEY = 'oklch-generator-state';
const STEP_NAMES = ['100', '99', '98', '95', '90', '80', '70', '60', '50', '40', '35', '30', '25', '20', '15', '10', '5', '0'];

// Preset base colors
const PRESET_COLORS = [
  '#78787C', '#5B67E8', '#747695', '#9A6588', 
  '#E20314', '#CD4400', '#937502', '#268F4F', 
  '#2B8697', '#066CFF', '#5B67E8', '#8747F7', 
  '#D8027B', '#8747F7', '#9E50C3', '#797784'
];

function App() {
  // Load initial state from localStorage
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return null;
  };

  const initialState = loadState();

  const [steps, setSteps] = useState(initialState?.steps || 18);
  const [globalChroma, setGlobalChroma] = useState(initialState?.globalChroma || 0.15);
  const [contrastTargets, setContrastTargets] = useState(initialState?.contrastTargets || {});
  const [palettes, setPalettes] = useState(initialState?.palettes || [
    { id: 'primary', l: 0.6, h: 260 },
    { id: 'secondary', l: 0.7, h: 140 },
  ]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = { steps, globalChroma, contrastTargets, palettes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [steps, globalChroma, contrastTargets, palettes]);

  const addPalette = () => {
    const { h, l } = randomColor();
    const newId = `color-${Date.now()}`;
    setPalettes([...palettes, { id: newId, l, h }]);
  };

  const removePalette = (id) => {
    setPalettes(palettes.filter(p => p.id !== id));
  };

  const updatePalette = (id, newProps) => {
    setPalettes(palettes.map(p => p.id === id ? newProps : p));
  };

  const handleStepsChange = (delta) => {
    setSteps(Math.max(3, steps + delta));
  };

  const handleContrastChange = (index, value) => {
    const val = parseFloat(value);
    setContrastTargets(prev => ({
      ...prev,
      [index]: isNaN(val) ? null : val
    }));
  };

  const loadPresets = () => {
    const presetPalettes = PRESET_COLORS.map((hex, index) => {
      const oklch = hexToOklch(hex);
      if (oklch) {
        return {
          id: `preset-${index}`,
          l: oklch.l,
          h: oklch.h
        };
      }
      return null;
    }).filter(Boolean);
    
    setPalettes(presetPalettes);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>OKLCH Palette Generator</h1>
        <p>Create beautiful, consistent color scales with the OKLCH color space.</p>
        
        <div className="global-controls">
          <div className="control-section">
            <label>Steps per color:</label>
            <div className="step-control">
              <button onClick={() => handleStepsChange(-1)}>-</button>
              <span>{steps}</span>
              <button onClick={() => handleStepsChange(1)}>+</button>
            </div>
          </div>
          <div className="control-section">
            <label>Global Chroma:</label>
            <input 
              type="range" 
              min="0" 
              max="0.4" 
              step="0.01" 
              value={globalChroma} 
              onChange={(e) => setGlobalChroma(parseFloat(e.target.value))} 
            />
            <span className="value-display">{globalChroma.toFixed(2)}</span>
          </div>
          <div className="control-section">
            <button className="preset-btn" onClick={loadPresets}>
              Load Presets
            </button>
          </div>
        </div>

        <div className="contrast-grid" style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }}>
           {Array.from({ length: steps }).map((_, i) => (
             <div key={i} className="contrast-input-wrapper">
               <label>{STEP_NAMES[i] || i}</label>
               <input 
                 type="number" 
                 step="0.1" 
                 placeholder="-"
                 value={contrastTargets[i] || ''} 
                 onChange={(e) => handleContrastChange(i, e.target.value)}
               />
             </div>
           ))}
        </div>
      </header>
      
      <main className="palette-container">
        {palettes.map(palette => (
          <PaletteRow 
            key={palette.id} 
            color={palette}
            globalChroma={globalChroma}
            steps={steps}
            contrastTargets={contrastTargets}
            onUpdate={updatePalette} 
            onRemove={removePalette} 
          />
        ))}
        
        <button className="add-palette-btn" onClick={addPalette}>
          + Add Color Family
        </button>
      </main>

      <footer className="app-footer">
        <p>Built with Vite + React + OKLCH</p>
      </footer>
    </div>
  );
}

export default App;
