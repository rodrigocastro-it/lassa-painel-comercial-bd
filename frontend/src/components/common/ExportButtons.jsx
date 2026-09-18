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

  const btnClass =
    'focus-ring flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page-alt';

  return (
    <div className={`flex shrink-0 items-center gap-0.5 ${className}`}>
      {canExportTable && (
        <>
          <button
            type="button"
            onClick={() => exportToExcel(title, columns, rows)}
            title="Exportar Excel (.xlsx)"
            aria-label="Exportar Excel"
            className={`${btnClass} hover:text-lassa-green-600`}
          >
            <FileSpreadsheet size={15} />
          </button>
          <button
            type="button"
            onClick={() => exportToPdf(title, columns, rows, { subtitle })}
            title="Exportar PDF"
            aria-label="Exportar PDF"
            className={`${btnClass} hover:text-lassa-red-600`}
          >
            <FileText size={15} />
          </button>
        </>
      )}
      {captureRef && (
        <button
          type="button"
          onClick={handlePng}
          disabled={exportingPng}
          title="Baixar imagem PNG (para WhatsApp)"
          aria-label="Baixar imagem PNG"
          className={`${btnClass} hover:text-lassa-blue-700 disabled:opacity-60`}
        >
          {exportingPng ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </button>
      )}
    </div>
  );
}
