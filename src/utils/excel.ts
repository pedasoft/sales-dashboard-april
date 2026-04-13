import * as XLSX from 'xlsx';

export function exportToExcel(rows: Record<string, unknown>[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function downloadTargetTemplate() {
  const templateRows = [
    { year: new Date().getFullYear(), month: 1, manager_type: 'sales', manager_name: 'Örnek Yönetici', target_amount: 100000 }
  ];
  exportToExcel(templateRows, 'targets-template');
}

export async function parseExcelFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
}
