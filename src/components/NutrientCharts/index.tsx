import React, { useMemo, useState } from "react";

import {
  aggregateMealLogsByDate,
  formatNutrientLabel,
  MealLogEntry,
  NutrientKey,
} from "../../utils/nutrientAggregation";

type NutrientChartsProps = {
  mealLogs: MealLogEntry[];
  macroNutrients?: NutrientKey[];
  microNutrients?: NutrientKey[];
};

type NutrientSeries = {
  key: NutrientKey;
  label: string;
  values: number[];
};

const DEFAULT_MACROS: NutrientKey[] = ["protein", "carbs", "fat"];
const DEFAULT_MICROS: NutrientKey[] = ["iron", "magnesium", "vitaminD"];

const chartColors: Record<NutrientKey, string> = {
  protein: "#4E79A7",
  carbs: "#F28E2B",
  fat: "#E15759",
  iron: "#76B7B2",
  magnesium: "#59A14F",
  vitaminD: "#EDC948",
};

const buildSeries = (
  aggregated: ReturnType<typeof aggregateMealLogsByDate>,
  nutrients: NutrientKey[],
): NutrientSeries[] =>
  nutrients.map((key) => ({
    key,
    label: formatNutrientLabel(key),
    values: aggregated.map((entry) => entry.totals[key] ?? 0),
  }));

const linePath = (values: number[], width: number, height: number): string => {
  if (values.length === 0) {
    return "";
  }
  const max = Math.max(...values, 1);
  const stepX = width / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

export const NutrientCharts = ({
  mealLogs,
  macroNutrients = DEFAULT_MACROS,
  microNutrients = DEFAULT_MICROS,
}: NutrientChartsProps) => {
  const [showMacros, setShowMacros] = useState(true);
  const [showMicros, setShowMicros] = useState(true);

  const aggregated = useMemo(
    () => aggregateMealLogsByDate(mealLogs),
    [mealLogs],
  );

  const macroSeries = useMemo(
    () => buildSeries(aggregated, macroNutrients),
    [aggregated, macroNutrients],
  );
  const microSeries = useMemo(
    () => buildSeries(aggregated, microNutrients),
    [aggregated, microNutrients],
  );

  const dates = aggregated.map((entry) => entry.date);

  return (
    <section style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Nutrient Trends</h2>
          <p style={styles.subtitle}>
            Toggle nutrient groups to explore macro and micronutrient totals from
            your meal logs.
          </p>
        </div>
        <div style={styles.toggles}>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={showMacros}
              onChange={() => setShowMacros((prev) => !prev)}
            />
            <span style={styles.toggleLabel}>Macros</span>
          </label>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={showMicros}
              onChange={() => setShowMicros((prev) => !prev)}
            />
            <span style={styles.toggleLabel}>Micros</span>
          </label>
        </div>
      </header>

      {aggregated.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No meal data yet</p>
          <p style={styles.emptyText}>
            Log meals to see daily nutrient totals appear here.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {showMacros &&
            macroSeries.map((series) => (
              <ChartCard key={series.key} series={series} dates={dates} />
            ))}
          {showMicros &&
            microSeries.map((series) => (
              <ChartCard key={series.key} series={series} dates={dates} />
            ))}
        </div>
      )}
    </section>
  );
};

type ChartCardProps = {
  series: NutrientSeries;
  dates: string[];
};

const ChartCard = ({ series, dates }: ChartCardProps) => {
  const width = 240;
  const height = 120;
  const maxValue = Math.max(...series.values, 0);
  const total = series.values.reduce((sum, value) => sum + value, 0);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <p style={styles.cardTitle}>{series.label}</p>
          <p style={styles.cardValue}>
            {total.toFixed(1)} total · {maxValue.toFixed(1)} max
          </p>
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor: chartColors[series.key],
          }}
        />
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={styles.chart}
      >
        <path
          d={linePath(series.values, width, height)}
          fill="none"
          stroke={chartColors[series.key]}
          strokeWidth={3}
        />
        {series.values.map((value, index) => {
          const max = Math.max(...series.values, 1);
          const x =
            index * (width / Math.max(series.values.length - 1, 1));
          const y = height - (value / max) * height;
          return (
            <circle
              key={`${series.key}-${index}`}
              cx={x}
              cy={y}
              r={4}
              fill={chartColors[series.key]}
            />
          );
        })}
      </svg>
      <div style={styles.datesRow}>
        {dates.map((date, index) => (
          <span key={`${series.key}-${date}-${index}`} style={styles.dateLabel}>
            {date.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    margin: 0,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#5f6b7a",
  },
  toggles: {
    display: "flex",
    gap: "16px",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  toggleLabel: {
    fontWeight: 600,
  },
  emptyState: {
    border: "1px dashed #d0d7de",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    color: "#6b7280",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 4px",
  },
  emptyText: {
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 600,
    margin: 0,
  },
  cardValue: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },
  badge: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  chart: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "8px",
  },
  datesRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#9ca3af",
  },
  dateLabel: {
    minWidth: 0,
  },
};

export default NutrientCharts;
