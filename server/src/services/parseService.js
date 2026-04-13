import path from "node:path";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { AppError } from "../lib/appError.js";

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return String(value).trim();
}

function normalizeRows(rows) {
  return rows
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [String(key).trim(), normalizeCellValue(value)])
      )
    )
    .filter((row) => Object.keys(row).length > 0);
}

function parseCsv(buffer) {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  });
}

async function parseWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values
    .slice(1)
    .map((value, index) => String(value ?? `Column ${index + 1}`).trim());

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = row.values.slice(1);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  });

  return rows;
}

export async function parseUploadedDataset(file) {
  if (!file) {
    throw new AppError("A file is required.", 400);
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const rawRows = extension === ".csv" ? parseCsv(file.buffer) : await parseWorkbook(file.buffer);
  const rows = normalizeRows(rawRows);

  if (!rows.length) {
    throw new AppError("The uploaded file does not contain usable rows.", 400);
  }

  return {
    fileName: file.originalname,
    rows
  };
}

export async function parseDatasetBuffer(fileName, buffer) {
  const extension = path.extname(fileName).toLowerCase();
  const rawRows = extension === ".csv" ? parseCsv(buffer) : await parseWorkbook(buffer);
  const rows = normalizeRows(rawRows);

  if (!rows.length) {
    throw new AppError("The dataset does not contain usable rows.", 400);
  }

  return {
    fileName,
    rows
  };
}
