import OpenAI from "openai";
import { env } from "../config/env.js";

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

function buildFallbackNarrative(analysis) {
  return {
    executiveSummary: analysis.summary,
    insights: analysis.insights,
    recommendations: analysis.recommendations
  };
}

export async function enrichAnalysisWithAI(datasetName, analysis) {
  if (!client) {
    return buildFallbackNarrative(analysis);
  }

  const prompt = [
    {
      role: "system",
      content:
        "You are a senior analytics strategist. Return valid JSON with keys executiveSummary, insights, recommendations. insights must be an array of objects with title, detail, severity where severity is info, opportunity, or warning. recommendations must be an array of strings."
    },
    {
      role: "user",
      content: `Dataset: ${datasetName}
Summary: ${analysis.summary}
Metrics: ${JSON.stringify(analysis.metrics)}
Column stats: ${JSON.stringify(analysis.datasetMeta.columnStats.slice(0, 8))}
Rule-based insights: ${JSON.stringify(analysis.insights)}
Recommendations: ${JSON.stringify(analysis.recommendations)}
Create a concise executive summary and stronger business-facing insights.`
    }
  ];

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "insightforge_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["executiveSummary", "insights", "recommendations"],
            properties: {
              executiveSummary: {
                type: "string"
              },
              insights: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "detail", "severity"],
                  properties: {
                    title: { type: "string" },
                    detail: { type: "string" },
                    severity: {
                      type: "string",
                      enum: ["info", "opportunity", "warning"]
                    }
                  }
                }
              },
              recommendations: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.output_text);

    return {
      executiveSummary: parsed.executiveSummary || analysis.summary,
      insights: parsed.insights?.length ? parsed.insights : analysis.insights,
      recommendations: parsed.recommendations?.length ? parsed.recommendations : analysis.recommendations
    };
  } catch {
    return buildFallbackNarrative(analysis);
  }
}
