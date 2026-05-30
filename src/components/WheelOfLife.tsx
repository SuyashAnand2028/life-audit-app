import React from 'react';
import type { WheelState } from '../types';

interface WheelOfLifeProps {
  value: WheelState;
  onChange: (newValue: WheelState) => void;
  empiricalValue?: WheelState;
}

const CATEGORIES: { key: keyof WheelState; label: string }[] = [
  { key: 'health', label: 'Health' },
  { key: 'wealth', label: 'Wealth' },
  { key: 'career', label: 'Career' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'leisure', label: 'Leisure' },
  { key: 'growth', label: 'Growth' },
];

const CENTER = 190;
const MAX_RADIUS = 140;

export const WheelOfLife: React.FC<WheelOfLifeProps> = ({ value, onChange, empiricalValue }) => {
  
  const getCoordinates = (index: number, score: number) => {
    const angle = index * ((2 * Math.PI) / 6) - Math.PI / 2;
    const radius = (score / 10) * MAX_RADIUS;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    };
  };

  // Generate SVG path points for a specific wheel state
  const getPointsString = (state: WheelState) => {
    return CATEGORIES.map((cat, idx) => {
      const { x, y } = getCoordinates(idx, state[cat.key]);
      return `${x},${y}`;
    }).join(' ');
  };

  // Pointer drag handler to dynamically modify scores
  const handlePointerDown = (category: keyof WheelState, index: number, e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    const svg = handle.ownerSVGElement;
    if (!svg) return;

    // Set pointer capture to receive events even if dragged outside SVG boundary
    handle.setPointerCapture(e.pointerId);

    const angle = index * ((2 * Math.PI) / 6) - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const updateScore = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect();
      const x = clientX - rect.left - CENTER;
      const y = clientY - rect.top - CENTER;

      // Project mouse position onto the axis unit vector
      const projection = x * cos + y * sin;
      
      // Calculate score between 1 and 10
      let newScore = (projection / MAX_RADIUS) * 10;
      newScore = Math.max(1, Math.min(10, Math.round(newScore * 2) / 2)); // Round to nearest 0.5 for smoother increments

      onChange({
        ...value,
        [category]: newScore,
      });
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateScore(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
    };

    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
  };

  const subjectivePoints = getPointsString(value);
  const empiricalPoints = empiricalValue ? getPointsString(empiricalValue) : '';

  return (
    <div className="wheel-container">
      <svg className="wheel-svg" viewBox="0 0 380 380">
        {/* Background Grid Circles */}
        {[2, 4, 6, 8, 10].map((level) => (
          <circle
            key={level}
            cx={CENTER}
            cy={CENTER}
            r={(level / 10) * MAX_RADIUS}
            className="wheel-grid-circle"
          />
        ))}

        {/* Axis Lines & Labels */}
        {CATEGORIES.map((cat, idx) => {
          const { x: endX, y: endY } = getCoordinates(idx, 10);
          const { x: labelX, y: labelY } = getCoordinates(idx, 11.5);
          
          return (
            <g key={cat.key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={endX}
                y2={endY}
                className="wheel-axis"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="wheel-label"
              >
                {cat.label}
              </text>
            </g>
          );
        })}

        {/* Empirical Data Polygon (Green Dash) */}
        {empiricalValue && (
          <polygon
            points={empiricalPoints}
            className="wheel-empirical-polygon"
          />
        )}

        {/* Subjective Data Polygon (Purple Fill) */}
        <polygon
          points={subjectivePoints}
          className="wheel-assessment-polygon"
        />

        {/* Interactive Draggable Knobs */}
        {CATEGORIES.map((cat, idx) => {
          const { x, y } = getCoordinates(idx, value[cat.key]);
          return (
            <circle
              key={cat.key}
              cx={x}
              cy={y}
              r="7"
              className="wheel-handle"
              onPointerDown={(e) => handlePointerDown(cat.key, idx, e)}
            >
              <title>{`${cat.label}: ${value[cat.key]}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};
export default WheelOfLife;
