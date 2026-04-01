import Papa from 'papaparse';
import { QUANTITY_COLUMN_NAMES } from '../constants';

export function parseCsv(
  file: File,
): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const data = results.data;
        resolve({ headers, data });
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

export function detectQuantityColumn(headers: string[]): string | null {
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    if (QUANTITY_COLUMN_NAMES.includes(lower)) {
      return header;
    }
  }
  return null;
}
