import React, { useState, useEffect } from 'react';
import { generatePalette, hexToOklch, oklchToHex } from '../utils/color';

const PaletteRow = ({ color, globalChroma, steps, contrastTargets, onUpdate, onRemove }) => {
  const { id, l, h } = color;
  const [hexInput, setHexInput] = useState(oklchToHex(l, globalChroma, h));

  useEffect(() => {
    // Sync hex input when props change (e.g. from sliders or global chroma)
    const newHex = oklchToHex(l, globalChroma, h);
    if (newHex !== hexInput) {
       setHexInput(newHex);
    }
  }, [l, globalChroma, h]);

  const handleParamChange = (param, value) => {
    onUpdate(id, { ...color, [param]: parseFloat(value) });
  };

  const handleHexChange = (e) => {
    const newHex = e.target.value;
    setHexInput(newHex);
    
    const oklch = hexToOklch(newHex);
    if (oklch) {
      // Only update l and h, not c (since chroma is global)
      onUpdate(id, { ...color, l: oklch.l, h: oklch.h });
    }
  };

  const paletteSteps = generatePalette(id, l, globalChroma, h, steps, contrastTargets);

  return (
    <div className="palette-row">
      <div className="row-controls">
        <div className="control-group">
          <label>Hex</label>
          <input 
            type="text" 
            value={hexInput} 
            onChange={handleHexChange} 
            className="hex-input"
            maxLength={7}
          />
        </div>
        <div className="control-group">
          <label>Hue</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={h} 
            onChange={(e) => handleParamChange('h', e.target.value)} 
          />
          <input 
            type="number" 
            value={Math.round(h)} 
            onChange={(e) => handleParamChange('h', e.target.value)} 
          />
        </div>
        <button className="remove-btn" onClick={() => onRemove(id)}>×</button>
      </div>
      <div className="steps-container">
        {paletteSteps.map((step, i) => (
          <div 
            key={step.id} 
            className={`color-step ${step.isContrastForced ? 'contrast-forced' : ''}`} 
            style={{ backgroundColor: step.css }}
            title={step.isContrastForced ? `Contrast forced to ${step.contrastTarget}:1` : ''}
          >
            <div className="step-info">
              <span className="step-value">{step.stepName}</span>
              {step.isContrastForced && <span className="contrast-badge">WCAG</span>}
              <span className="step-hex" onClick={() => navigator.clipboard.writeText(step.hex)}>
                {step.hex}
              </span>
              <span className="step-contrast">
                {step.contrast.toFixed(2)}:1
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaletteRow;
