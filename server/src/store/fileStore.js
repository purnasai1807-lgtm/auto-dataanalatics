import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

const storePath = path.resolve(process.cwd(), env.DATA_FILE_PATH);
const defaultStore = {
  users: [],
  reports: []
};

let writeQueue = Promise.resolve();

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(storePath), { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(raw || "{}");

  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    reports: Array.isArray(parsed.reports) ? parsed.reports : []
  };
}

async function writeStore(store) {
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function withStore(mutator) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}

export async function readOnlyStore(selector) {
  await writeQueue;
  const store = await readStore();
  return selector(store);
}

export function createRecordId() {
  return randomUUID();
}

export function nowIsoString() {
  return new Date().toISOString();
}

export function matchRecord(record, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (typeof value === "undefined") {
      return true;
    }

    const left = record[key];
    return String(left) === String(value);
  });
}

export function sortRecords(records, sortConfig = {}) {
  const [[field, direction] = ["createdAt", -1]] = Object.entries(sortConfig);
  const factor = direction >= 0 ? 1 : -1;

  return [...records].sort((left, right) => {
    const leftValue = new Date(left[field] ?? 0).getTime();
    const rightValue = new Date(right[field] ?? 0).getTime();
    return (leftValue - rightValue) * factor;
  });
}

export function cloneRecord(record) {
  return cloneValue(record);
}
