import { useState } from 'react';
import { FileSpreadsheet, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { exportNodeToPng, exportToExcel, exportToPdf } from '../../utils/exportUtils';

/**
 * Botões de exportação de um bloco do dashboard.
 * - Excel/PDF exigem `columns` + `rows` (dados tabulares).
 * - PNG exige `captureRef` apontando para o nó a ser fotografado.
 */
export default function ExportButtons({ title, subtitle, columns, rows, captureRef, className = '' }) {
  const [exportingPng, setExportingPng] = useState(false);
  const canExportTable = Boolean(columns?.length && rows);

  const handlePng = async () => {
    if (!captureRef?.current) return;
    setExportingPng(true);
    try {
      await exportNodeToPng(captureRef.current, title);
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className={`flex shrink-0 items-center gap-1.5 ${className}`}>
      {canExportTable && (
        <>
          <button
            type="button"
            onClick={() => exportToExcel(title, columns, rows)}
            title="Exportar Excel (.xlsx)"
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:border-lassa-green-500 hover:text-lassa-green-600"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden md:inline">Excel</span>
          </button>
          <button
            type="button"
            onClick={() => exportToPdf(title, columns, rows, { subtitle })}
            title="Exportar PDF"
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:border-lassa-red-500 hover:text-lassa-red-600"
          >
            <FileText size={14} />
            <span className="hidden md:inline">PDF</span>
          </button>
        </>
      )}
      {captureRef && (
        <button
          type="button"
          onClick={handlePng}
          disabled={exportingPng}
          title="Baixar imagem PNG (para WhatsApp)"
          className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:border-lassa-blue-500 hover:text-lassa-blue-700 disabled:opacity-60"
        >
          {exportingPng ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          <span className="hidden md:inline">Imagem</span>
        </button>
      )}
    </div>
  );
}
