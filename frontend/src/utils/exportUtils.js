import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

function safeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/_+/g, '_');
}

function safeSheetName(name) {
  // Nomes de aba do Excel não podem conter : \ / ? * [ ] e têm no máximo 31 caracteres.
  const cleaned = name.replace(/[:\\/?*[\]]/g, '-').trim();
  return cleaned.slice(0, 31) || 'Planilha1';
}

function timestampSuffix() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/**
 * Exporta uma tabela (array de objetos) para .xlsx.
 * @param {string} title - nome do arquivo / aba
 * @param {Array<{key:string,label:string}>} columns
 * @param {Array<object>} rows
 */
export function exportToExcel(title, columns, rows) {
  const data = rows.map((row) => {
    const out = {};
    columns.forEach((col) => {
      out[col.label] = col.format ? col.format(row[col.key], row) : row[col.key];
    });
    return out;
  });
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(title));
  XLSX.writeFile(workbook, `${safeFileName(title)}_${timestampSuffix()}.xlsx`);
}

/**
 * Exporta uma tabela para PDF executivo (retrato/paisagem automático conforme nº de colunas).
 */
export function exportToPdf(title, columns, rows, { subtitle } = {}) {
  const orientation = columns.length > 5 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'pt' });

  doc.setFontSize(16);
  doc.setTextColor(11, 15, 25);
  doc.text('Lassa — Painel de Inteligência Comercial', 40, 40);
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 101);
  doc.text(title, 40, 60);
  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 40, 76);
  }

  autoTable(doc, {
    startY: subtitle ? 90 : 76,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((col) => {
      const value = col.format ? col.format(row[col.key], row) : row[col.key];
      return value === undefined || value === null ? '—' : String(value);
    })),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [28, 92, 171], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(138, 147, 163);
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} · Página ${i} de ${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  doc.save(`${safeFileName(title)}_${timestampSuffix()}.pdf`);
}

/**
 * Captura um bloco do dashboard (por ref) em PNG, pronto para WhatsApp.
 */
export async function exportNodeToPng(node, fileName) {
  if (!node) return;
  const canvas = await html2canvas(node, {
    backgroundColor: '#fcfcfb',
    scale: 2,
    useCORS: true,
  });
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${safeFileName(fileName)}_${timestampSuffix()}.png`;
  // O elemento precisa estar no DOM para o clique disparar o download de
  // forma confiável em todos os navegadores.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
