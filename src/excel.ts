import * as XLSX from "xlsx";
import type { PriceRow } from "./memory.js";

type ParseContext = {
  sourceId?: string;
  fileName?: string;
};

export function parsePriceWorkbook(buffer: Buffer, context: ParseContext): PriceRow[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true
  });

  return [
    ...parseMasterSpecial(workbook, "Master Special", context),
    ...parseMasterSpecial(workbook, "Master Special 野菜", context),
    ...parseCheapList(workbook, context)
  ];
}

function parseMasterSpecial(
  workbook: XLSX.WorkBook,
  sheetName: string,
  context: ParseContext
): PriceRow[] {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true
  });

  const result: PriceRow[] = [];
  let category: string | null = null;

  for (const row of rows.slice(2)) {
    const productName = text(row[1]);
    const origin = text(row[2]);
    const size = text(row[3]);
    const jpPriceLow = num(row[4]);
    const jpPriceHigh = num(row[5]);
    const kg = num(row[6]);

    if (productName && !jpPriceLow && !origin && !size) {
      category = productName;
      continue;
    }

    if (!productName || (!jpPriceLow && !jpPriceHigh)) {
      continue;
    }

    result.push({
      source_id: context.sourceId ?? null,
      file_name: context.fileName ?? null,
      sheet_name: sheetName,
      category,
      product_name: productName,
      origin,
      size,
      kg,
      jp_price_low: jpPriceLow,
      jp_price_high: jpPriceHigh,
      malaysia_low: num(row[12]),
      malaysia_high: num(row[18]),
      thailand_low: num(row[25]),
      thailand_high: num(row[31]),
      singapore_low: num(row[38]),
      singapore_high: num(row[44]),
      cambodia_case: num(row[51]),
      raw_row: compactRawRow(row)
    });
  }

  return result;
}

function parseCheapList(workbook: XLSX.WorkBook, context: ParseContext): PriceRow[] {
  const sheetName = "Master Cheap list";
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true
  });

  return rows
    .slice(2)
    .map((row): PriceRow | null => {
      const productName = text(row[0]);
      const jpPriceLow = num(row[1]);

      if (!productName || !jpPriceLow) {
        return null;
      }

      return {
        source_id: context.sourceId ?? null,
        file_name: context.fileName ?? null,
        sheet_name: sheetName,
        product_name: productName,
        kg: num(row[2]),
        jp_price_low: jpPriceLow,
        malaysia_low: num(row[7]),
        thailand_low: num(row[14]),
        singapore_low: num(row[22]),
        cambodia_case: num(row[30]),
        cambodia_kg: num(row[32]),
        raw_row: compactRawRow(row)
      };
    })
    .filter((row): row is PriceRow => Boolean(row));
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized && !normalized.startsWith("#") ? normalized : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function compactRawRow(row: unknown[]): Record<string, unknown> {
  return Object.fromEntries(
    row
      .map((value, index) => [`c${index + 1}`, value] as const)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
}
