import mongoose from "mongoose";
import { env } from "../config/env.js";
import { cloneRecord, createRecordId, matchRecord, nowIsoString, readOnlyStore, sortRecords, withStore } from "../store/fileStore.js";

const insightSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    detail: { type: String, required: true },
    severity: { type: String, enum: ["info", "opportunity", "warning"], default: "info" }
  },
  { _id: false }
);

const chartSeriesSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ["bar", "line", "pie"], required: true },
    data: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    insights: {
      type: [insightSchema],
      default: []
    },
    recommendations: {
      type: [String],
      default: []
    },
    chartData: {
      type: [chartSeriesSchema],
      default: []
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    datasetMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    sampleRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    source: {
      type: String,
      enum: ["upload", "demo"],
      default: "upload"
    }
  },
  {
    timestamps: true
  }
);

const mongoReportModel = mongoose.model("Report", reportSchema);

const useMongoStore = Boolean(env.MONGODB_URI && !["disabled", "false", "none"].includes(env.MONGODB_URI.toLowerCase()));

class FileReportDocument {
  constructor(record) {
    this._id = record._id;
    this.userId = record.userId;
    this.fileName = record.fileName;
    this.summary = record.summary;
    this.insights = record.insights ?? [];
    this.recommendations = record.recommendations ?? [];
    this.chartData = record.chartData ?? [];
    this.metrics = record.metrics ?? {};
    this.datasetMeta = record.datasetMeta ?? {};
    this.sampleRows = record.sampleRows ?? [];
    this.source = record.source ?? "upload";
    this.createdAt = new Date(record.createdAt ?? Date.now());
    this.updatedAt = new Date(record.updatedAt ?? Date.now());
  }

  get id() {
    return this._id;
  }

  toObject() {
    return {
      _id: this._id,
      userId: this.userId,
      fileName: this.fileName,
      summary: this.summary,
      insights: cloneRecord(this.insights),
      recommendations: cloneRecord(this.recommendations),
      chartData: cloneRecord(this.chartData),
      metrics: cloneRecord(this.metrics),
      datasetMeta: cloneRecord(this.datasetMeta),
      sampleRows: cloneRecord(this.sampleRows),
      source: this.source,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

class FileReportQuery {
  constructor(query) {
    this.query = query;
    this.sortConfig = null;
    this.limitCount = null;
  }

  sort(sortConfig) {
    this.sortConfig = sortConfig;
    return this;
  }

  limit(limitCount) {
    this.limitCount = limitCount;
    return this;
  }

  async exec() {
    let records = await readOnlyStore((store) => store.reports.filter((item) => matchRecord(item, this.query)));

    if (this.sortConfig) {
      records = sortRecords(records, this.sortConfig);
    }

    if (typeof this.limitCount === "number") {
      records = records.slice(0, this.limitCount);
    }

    return records.map((record) => new FileReportDocument(record));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

const fileReportModel = {
  find(query) {
    return new FileReportQuery(query);
  },
  async findOne(query) {
    const record = await readOnlyStore((store) => store.reports.find((item) => matchRecord(item, query)) ?? null);
    return record ? new FileReportDocument(record) : null;
  },
  async create(data) {
    const createdAt = nowIsoString();
    const record = await withStore((store) => {
      const nextRecord = {
        _id: createRecordId(),
        userId: String(data.userId),
        fileName: data.fileName,
        summary: data.summary,
        insights: cloneRecord(data.insights ?? []),
        recommendations: cloneRecord(data.recommendations ?? []),
        chartData: cloneRecord(data.chartData ?? []),
        metrics: cloneRecord(data.metrics ?? {}),
        datasetMeta: cloneRecord(data.datasetMeta ?? {}),
        sampleRows: cloneRecord(data.sampleRows ?? []),
        source: data.source ?? "upload",
        createdAt,
        updatedAt: createdAt
      };

      store.reports.push(nextRecord);
      return cloneRecord(nextRecord);
    });

    return new FileReportDocument(record);
  },
  async insertMany(records) {
    const created = await withStore((store) => {
      const inserted = records.map((record) => {
        const createdAt = new Date(record.createdAt ?? Date.now()).toISOString();
        return {
          _id: createRecordId(),
          userId: String(record.userId),
          fileName: record.fileName,
          summary: record.summary,
          insights: cloneRecord(record.insights ?? []),
          recommendations: cloneRecord(record.recommendations ?? []),
          chartData: cloneRecord(record.chartData ?? []),
          metrics: cloneRecord(record.metrics ?? {}),
          datasetMeta: cloneRecord(record.datasetMeta ?? {}),
          sampleRows: cloneRecord(record.sampleRows ?? []),
          source: record.source ?? "upload",
          createdAt,
          updatedAt: new Date(record.updatedAt ?? createdAt).toISOString()
        };
      });

      store.reports.push(...inserted);
      return cloneRecord(inserted);
    });

    return created.map((record) => new FileReportDocument(record));
  },
  async deleteMany(query) {
    await withStore((store) => {
      store.reports = store.reports.filter((item) => !matchRecord(item, query));
    });
  }
};

export const Report = useMongoStore ? mongoReportModel : fileReportModel;
