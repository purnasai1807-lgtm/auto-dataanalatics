function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[$,%\s,]/g, "");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function getColumnStats(rows, columns) {
  return columns.map((column) => {
    const numericValues = [];
    const categoricalValues = new Map();
    let dateCount = 0;

    for (const row of rows) {
      const rawValue = row[column];
      const numericValue = toNumber(rawValue);
      const dateValue = toDateValue(rawValue);

      if (numericValue !== null) {
        numericValues.push(numericValue);
      }

      if (dateValue) {
        dateCount += 1;
      }

      const label = String(rawValue ?? "").trim();
      if (label) {
        categoricalValues.set(label, (categoricalValues.get(label) ?? 0) + 1);
      }
    }

    return {
      name: column,
      numericCount: numericValues.length,
      dateCount,
      distinctCount: categoricalValues.size,
      topValues: [...categoricalValues.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([label, count]) => ({ label, count })),
      summary: numericValues.length
        ? {
            min: round(Math.min(...numericValues)),
            max: round(Math.max(...numericValues)),
            average: round(numericValues.reduce((total, value) => total + value, 0) / numericValues.length),
            total: round(numericValues.reduce((total, value) => total + value, 0))
          }
        : null
    };
  });
}

function buildTimeSeries(rows, dateColumn, numericColumn) {
  return rows
    .map((row) => ({
      label: String(row[dateColumn]),
      value: toNumber(row[numericColumn]),
      date: toDateValue(row[dateColumn])
    }))
    .filter((item) => item.date && item.value !== null)
    .sort((left, right) => left.date - right.date)
    .slice(0, 20)
    .map((item) => ({
      label: item.label,
      value: round(item.value)
    }));
}

function buildCategorySeries(rows, categoryColumn, numericColumn) {
  const bucket = new Map();

  for (const row of rows) {
    const label = String(row[categoryColumn] ?? "").trim();
    const value = toNumber(row[numericColumn]);

    if (!label || value === null) {
      continue;
    }

    const current = bucket.get(label) ?? { total: 0, count: 0 };
    current.total += value;
    current.count += 1;
    bucket.set(label, current);
  }

  return [...bucket.entries()]
    .map(([label, value]) => ({
      label,
      value: round(value.total / value.count)
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);
}

function buildCategoryCountSeries(rows, categoryColumn) {
  const bucket = new Map();

  for (const row of rows) {
    const label = String(row[categoryColumn] ?? "").trim();
    if (!label) {
      continue;
    }
    bucket.set(label, (bucket.get(label) ?? 0) + 1);
  }

  return [...bucket.entries()]
    .map(([label, value]) => ({
      label,
      value
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
}

function buildMetrics(rows, columnStats, numericColumns) {
  const primaryMetric = numericColumns[0];

  return {
    totalRows: rows.length,
    totalColumns: columnStats.length,
    numericColumns: numericColumns.length,
    primaryMetricTotal: primaryMetric?.summary?.total ?? null,
    primaryMetricAverage: primaryMetric?.summary?.average ?? null,
    highestValue: primaryMetric?.summary?.max ?? null
  };
}

function buildRuleBasedInsights(columnStats, metrics, timeSeries, categorySeries) {
  const insights = [];
  const recommendations = [];

  if (metrics.primaryMetricTotal !== null) {
    insights.push({
      title: "Primary metric volume",
      detail: `The leading numeric field totals ${metrics.primaryMetricTotal.toLocaleString()}.`,
      severity: "info"
    });
  }

  const dominantCategory = categorySeries[0];
  if (dominantCategory) {
    insights.push({
      title: "Top-performing segment",
      detail: `${dominantCategory.label} leads the grouped comparison at ${dominantCategory.value.toLocaleString()}.`,
      severity: "opportunity"
    });
    recommendations.push(`Double down on ${dominantCategory.label} and compare it against lower-performing segments for repeatable patterns.`);
  }

  if (timeSeries.length >= 3) {
    const firstValue = timeSeries[0].value;
    const lastValue = timeSeries[timeSeries.length - 1].value;
    const trend = lastValue > firstValue ? "upward" : lastValue < firstValue ? "downward" : "stable";
    insights.push({
      title: "Trend direction",
      detail: `The time series shows a ${trend} trend from ${firstValue.toLocaleString()} to ${lastValue.toLocaleString()}.`,
      severity: trend === "downward" ? "warning" : "info"
    });

    if (trend === "downward") {
      recommendations.push("Investigate the periods where the drop accelerates and review campaign, pricing, or channel changes around those dates.");
    }
  }

  const sparseNumeric = columnStats.find(
    (column) => column.summary && column.numericCount > 0 && column.numericCount < metrics.totalRows * 0.7
  );

  if (sparseNumeric) {
    insights.push({
      title: "Data completeness risk",
      detail: `${sparseNumeric.name} has missing or non-numeric values in a meaningful share of rows.`,
      severity: "warning"
    });
    recommendations.push(`Clean ${sparseNumeric.name} before using it for forecasting or executive reporting.`);
  }

  if (!recommendations.length) {
    recommendations.push("Share this report with your team and compare this dataset against prior periods to find repeatable drivers of performance.");
  }

  return {
    insights,
    recommendations
  };
}

export function analyzeDataset(rows) {
  const columns = Object.keys(rows[0] ?? {});
  const columnStats = getColumnStats(rows, columns);
  const numericColumns = columnStats.filter((column) => column.summary);
  const dateColumn = columnStats.find((column) => column.dateCount >= rows.length * 0.5);
  const primaryNumeric = numericColumns[0];
  const primaryCategory = columnStats.find(
    (column) => !column.summary && column.distinctCount > 1 && column.distinctCount <= Math.max(Math.min(rows.length, 12), 2)
  );

  const timeSeries =
    dateColumn && primaryNumeric ? buildTimeSeries(rows, dateColumn.name, primaryNumeric.name) : [];
  const categorySeries =
    primaryCategory && primaryNumeric ? buildCategorySeries(rows, primaryCategory.name, primaryNumeric.name) : [];
  const pieSeries = primaryCategory ? buildCategoryCountSeries(rows, primaryCategory.name) : [];
  const metrics = buildMetrics(rows, columnStats, numericColumns);
  const rules = buildRuleBasedInsights(columnStats, metrics, timeSeries, categorySeries);

  const chartData = [
    ...(timeSeries.length
      ? [
          {
            label: `${primaryNumeric.name} over time`,
            type: "line",
            data: timeSeries
          }
        ]
      : []),
    ...(categorySeries.length
      ? [
          {
            label: `${primaryNumeric.name} by ${primaryCategory.name}`,
            type: "bar",
            data: categorySeries
          }
        ]
      : []),
    ...(pieSeries.length
      ? [
          {
            label: `${primaryCategory?.name ?? "Category"} distribution`,
            type: "pie",
            data: pieSeries
          }
        ]
      : [])
  ];

  const summary = `Analyzed ${rows.length.toLocaleString()} rows across ${columns.length} columns with ${numericColumns.length} numeric measures identified.`;

  return {
    summary,
    insights: rules.insights,
    recommendations: rules.recommendations,
    chartData,
    metrics,
    datasetMeta: {
      columns,
      columnStats,
      detectedDateColumn: dateColumn?.name ?? null,
      detectedPrimaryMetric: primaryNumeric?.name ?? null,
      detectedGroupingColumn: primaryCategory?.name ?? null
    },
    sampleRows: rows.slice(0, 5)
  };
}
