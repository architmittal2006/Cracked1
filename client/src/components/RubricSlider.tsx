import React from 'react';

interface RubricDimension {
  key: string;
  label: string;
  description: string;
  weight: number;
  weightLabel: string;
}

interface RubricSliderProps {
  dimension: RubricDimension;
  value: number;
  onChange: (value: number) => void;
}

export const RubricSlider: React.FC<RubricSliderProps> = ({ dimension, value, onChange }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            {dimension.label}
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded">
              {dimension.weightLabel}
            </span>
          </h4>
        </div>
        <div className="text-2xl font-black font-mono text-emerald-400 w-8 text-right">
          {value}
        </div>
      </div>
      
      <div className="relative mb-2">
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="rubric-slider"
          aria-label={dimension.label}
        />
        <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
          <span>1 (Poor)</span>
          <span>2</span>
          <span>3 (Avg)</span>
          <span>4</span>
          <span>5 (Elite)</span>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 leading-relaxed mt-2">
        {dimension.description}
      </p>
    </div>
  );
};
