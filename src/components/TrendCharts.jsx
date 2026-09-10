import { useState } from "react";

export function PhysicalProgressTrendChart({ milestones = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!milestones || milestones.length === 0) {
    return (
      <div className="chart-empty">
        <p>No historical physical progress snapshots logged yet.</p>
        <span className="subtext">Add progress milestones to visualize tracking velocity.</span>
      </div>
    );
  }

  // Width / Height bounds
  const width = 520;
  const height = 210;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const n = milestones.length;
  const getX = (i) => padLeft + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const getY = (val) => padTop + chartH - ((Math.min(100, Math.max(0, val || 0)) / 100) * chartH);

  const actualPoints = milestones.map((m, i) => `${getX(i)},${getY(m.actualPercent)}`).join(" ");
  const plannedPoints = milestones.map((m, i) => `${getX(i)},${getY(m.plannedPercent)}`).join(" ");

  const areaPoints = n === 1
    ? `${getX(0)},${padTop + chartH} ${getX(0)},${getY(milestones[0].actualPercent)} ${getX(0)},${padTop + chartH}`
    : `${padLeft},${padTop + chartH} ${actualPoints} ${padLeft + chartW},${padTop + chartH}`;

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <defs>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Gridlines and Labels (0%, 25%, 50%, 75%, 100%) */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = getY(pct);
          return (
            <g key={pct}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + chartW}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={pct === 0 ? "none" : "3 3"}
                strokeWidth={pct === 0 ? "1.5" : "1"}
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Area fill for actual progress */}
        <polygon points={areaPoints} fill="url(#actualGrad)" />

        {/* Planned progress line (dashed purple) */}
        <polyline
          points={plannedPoints}
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Actual progress line (solid blue) */}
        <polyline
          points={actualPoints}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Planned data dots */}
        {milestones.map((m, i) => {
          const cx = getX(i);
          const cy = getY(m.plannedPercent);
          return (
            <circle
              key={`p-${i}`}
              cx={cx}
              cy={cy}
              r="3.5"
              fill="#818cf8"
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Actual data dots & interactions */}
        {milestones.map((m, i) => {
          const cx = getX(i);
          const cy = getY(m.actualPercent);
          return (
            <g key={`a-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={hoveredPoint === i ? "6" : "4.5"}
                fill="#2563eb"
                stroke="white"
                strokeWidth="2"
                style={{ cursor: "pointer", transition: "r 0.15s" }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* X Axis Date labels */}
              <text
                x={cx}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {m.reportedDate ? m.reportedDate.slice(2) : `T${i + 1}`}
              </text>
            </g>
          );
        })}

        {/* Tooltip Overlay */}
        {hoveredPoint !== null && milestones[hoveredPoint] && (
          <g>
            <rect
              x={Math.max(10, Math.min(width - 150, getX(hoveredPoint) - 70))}
              y={Math.max(5, getY(milestones[hoveredPoint].actualPercent) - 45)}
              width="140"
              height="38"
              rx="6"
              fill="#1e293b"
              opacity="0.92"
            />
            <text
              x={Math.max(10, Math.min(width - 150, getX(hoveredPoint) - 70)) + 70}
              y={Math.max(5, getY(milestones[hoveredPoint].actualPercent) - 45) + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#f8fafc"
              fontWeight="600"
            >
              {milestones[hoveredPoint].reportedDate}
            </text>
            <text
              x={Math.max(10, Math.min(width - 150, getX(hoveredPoint) - 70)) + 70}
              y={Math.max(5, getY(milestones[hoveredPoint].actualPercent) - 45) + 29}
              textAnchor="middle"
              fontSize="10"
              fill="#93c5fd"
            >
              Actual: {milestones[hoveredPoint].actualPercent}% | Plan: {milestones[hoveredPoint].plannedPercent}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function FinancialExpenditureTrendChart({ financials = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!financials || financials.length === 0) {
    return (
      <div className="chart-empty">
        <p>No historical financial expenditure records logged yet.</p>
        <span className="subtext">Add financial snapshots to visualize budget burn rate.</span>
      </div>
    );
  }

  const width = 520;
  const height = 210;
  const padLeft = 55;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = Math.max(
    ...financials.map((f) => Math.max(f.cumulativeExpenditure || 0, f.plannedExpenditure || 0)),
    10
  );
  const roundedMax = Math.ceil(maxVal * 1.15);

  const n = financials.length;
  const getX = (i) => padLeft + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const getY = (val) => padTop + chartH - (((val || 0) / roundedMax) * chartH);

  const actualPoints = financials.map((f, i) => `${getX(i)},${getY(f.cumulativeExpenditure)}`).join(" ");
  const plannedPoints = financials.map((f, i) => `${getX(i)},${getY(f.plannedExpenditure)}`).join(" ");

  const areaPoints = n === 1
    ? `${getX(0)},${padTop + chartH} ${getX(0)},${getY(financials[0].cumulativeExpenditure)} ${getX(0)},${padTop + chartH}`
    : `${padLeft},${padTop + chartH} ${actualPoints} ${padLeft + chartW},${padTop + chartH}`;

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <defs>
          <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Gridlines and Labels (4 steps) */}
        {[0, 0.33, 0.66, 1.0].map((ratio) => {
          const val = Math.round(roundedMax * ratio);
          const y = getY(val);
          return (
            <g key={ratio}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + chartW}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={ratio === 0 ? "none" : "3 3"}
                strokeWidth={ratio === 0 ? "1.5" : "1"}
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                ₹{val}Cr
              </text>
            </g>
          );
        })}

        {/* Area fill for cumulative spend */}
        <polygon points={areaPoints} fill="url(#finGrad)" />

        {/* Planned expenditure line (dashed amber) */}
        <polyline
          points={plannedPoints}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Cumulative expenditure line (solid emerald) */}
        <polyline
          points={actualPoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Planned dots */}
        {financials.map((f, i) => (
          <circle
            key={`fp-${i}`}
            cx={getX(i)}
            cy={getY(f.plannedExpenditure)}
            r="3.5"
            fill="#f59e0b"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}

        {/* Cumulative dots & interactions */}
        {financials.map((f, i) => {
          const cx = getX(i);
          const cy = getY(f.cumulativeExpenditure);
          return (
            <g key={`fa-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={hoveredPoint === i ? "6" : "4.5"}
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
                style={{ cursor: "pointer", transition: "r 0.15s" }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* X Axis Date labels */}
              <text
                x={cx}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {f.reportedDate ? f.reportedDate.slice(2) : `T${i + 1}`}
              </text>
            </g>
          );
        })}

        {/* Tooltip Overlay */}
        {hoveredPoint !== null && financials[hoveredPoint] && (
          <g>
            <rect
              x={Math.max(10, Math.min(width - 160, getX(hoveredPoint) - 80))}
              y={Math.max(5, getY(financials[hoveredPoint].cumulativeExpenditure) - 45)}
              width="160"
              height="38"
              rx="6"
              fill="#1e293b"
              opacity="0.92"
            />
            <text
              x={Math.max(10, Math.min(width - 160, getX(hoveredPoint) - 80)) + 80}
              y={Math.max(5, getY(financials[hoveredPoint].cumulativeExpenditure) - 45) + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#f8fafc"
              fontWeight="600"
            >
              {financials[hoveredPoint].reportedDate}
            </text>
            <text
              x={Math.max(10, Math.min(width - 160, getX(hoveredPoint) - 80)) + 80}
              y={Math.max(5, getY(financials[hoveredPoint].cumulativeExpenditure) - 45) + 29}
              textAnchor="middle"
              fontSize="10"
              fill="#a7f3d0"
            >
              Spent: ₹{financials[hoveredPoint].cumulativeExpenditure}Cr | Plan: ₹{financials[hoveredPoint].plannedExpenditure}Cr
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
