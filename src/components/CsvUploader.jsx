import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2, MapPin, CloudUpload } from 'lucide-react';
import { useDataStore } from '../store/useStore';
import { dbService } from '../services/dbService';

const CsvUploader = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const { refreshFromDatabase } = useDataStore();

  // Parse a CSV string into preview rows
  const parsePreview = useCallback((text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1, 6).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
    return { headers, rows, totalRows: lines.length - 1 };
  }, []);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setError('Only .csv files are accepted');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);

    // Read preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parsePreview(e.target.result);
      setPreview(parsed);
    };
    reader.readAsText(f);
  }, [parsePreview]);

  // Drag handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    handleFile(droppedFile);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    handleFile(e.target.files?.[0]);
  }, [handleFile]);

  // Upload
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Goes through dbService so the Admin-gated endpoint gets the Bearer
      // token (and a transparent 401 refresh-retry).
      const data = await dbService.uploadCsv(file);

      setResult(data);

      // Refresh store from database to pick up new data
      if (data.successCount > 0 && refreshFromDatabase) {
        try {
          await refreshFromDatabase();
        } catch {
          // Silently fall through — data is in DB, user can refresh manually
        }
      }

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: 'var(--glass-thick)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 1px rgba(255,255,255,0.1) inset',
        }}
      >
        {/* Header gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-full overflow-hidden">
          <div className="w-full h-full animate-gradient" style={{ background: 'var(--gradient-siri)', backgroundSize: '200% 100%' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'var(--glass-regular)' }}>
              <CloudUpload className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Import Cases from CSV
              </h2>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Upload geographic incident data to the database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="p-2 rounded-xl transition-all duration-300"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--glass-regular)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Drop Zone */}
          {!result && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-2xl cursor-pointer transition-all duration-300"
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                background: isDragging ? 'rgba(10, 132, 255, 0.06)' : 'var(--glass-thin)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                aria-label="เลือกไฟล์ CSV เพื่อนำเข้า"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="p-4 rounded-2xl" style={{
                background: isDragging ? 'rgba(10, 132, 255, 0.12)' : 'var(--glass-regular)',
                transition: 'all 0.3s ease'
              }}>
                <Upload className="w-8 h-8" style={{ color: isDragging ? 'var(--accent-blue)' : 'var(--text-tertiary)' }} />
              </div>

              <div className="text-center">
                <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {file ? file.name : 'Drop your CSV file here'}
                </p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB • ${preview?.totalRows || '...'} rows`
                    : 'or click to browse • Max 10 MB'
                  }
                </p>
              </div>

              {file && (
                <button
                  onClick={(e) => { e.stopPropagation(); resetState(); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--glass-regular)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* CSV Format Help */}
          {!file && !result && (
            <div className="rounded-xl p-4" style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-[11px] font-bold mb-2" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                Required CSV Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['case_number', 'latitude', 'longitude'].map(col => (
                  <span key={col} className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold"
                    style={{ background: 'rgba(10, 132, 255, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(10, 132, 255, 0.15)' }}>
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-[11px] font-bold mt-3 mb-2" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                Optional Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['case_type', 'description', 'arrest_date', 'status', 'officer_in_charge', 'province', 'district', 'address_detail', 'location_type'].map(col => (
                  <span key={col} className="px-2 py-0.5 rounded-md text-[11px] font-mono"
                    style={{ background: 'var(--glass-regular)', color: 'var(--text-secondary)' }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {preview && !result && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="px-4 py-2" style={{ background: 'var(--glass-thin)', borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-[11px] font-bold" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                  Preview — first {preview.rows.length} of {preview.totalRows} rows
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: 'var(--glass-thin)' }}>
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                          style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri}>
                        {preview.headers.map((h, ci) => (
                          <td key={ci} className="px-3 py-1.5 whitespace-nowrap"
                            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(255, 69, 58, 0.08)', border: '1px solid rgba(255, 69, 58, 0.15)' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-red)' }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--accent-red)' }}>Upload Failed</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(48, 209, 88, 0.08)', border: '1px solid rgba(48, 209, 88, 0.15)' }}>
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-green)' }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--accent-green)' }}>Import Complete</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Rows', value: result.total, color: 'var(--accent-blue)' },
                  { label: 'Imported', value: result.successCount, color: 'var(--accent-green)' },
                  { label: 'Errors', value: result.errorCount, color: result.errorCount ? 'var(--accent-red)' : 'var(--text-tertiary)' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)' }}>
                    <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Error details */}
              {result.errors?.length > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[11px] font-bold mb-2" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent-red)' }}>
                    Row Errors
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-mono font-semibold" style={{ color: 'var(--accent-red)' }}>Row {err.row}:</span> {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Imported pins preview */}
              {result.inserted?.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="px-4 py-2" style={{ background: 'var(--glass-thin)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <p className="text-[11px] font-bold" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                      New Map Pins ({result.inserted.length})
                    </p>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.inserted.slice(0, 10).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
                        <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.caseNumber}
                        </span>
                        <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--text-quaternary)' }}>
                          {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                        </span>
                      </div>
                    ))}
                    {result.inserted.length > 10 && (
                      <div className="px-4 py-2 text-center">
                        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          +{result.inserted.length - 10} more pins
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {result ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300"
              style={{
                background: 'var(--accent-blue)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(10, 132, 255, 0.35)'
              }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300"
                style={{ background: 'var(--glass-regular)', color: 'var(--text-secondary)' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--glass-thick)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--glass-regular)'}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-2"
                style={{
                  background: file && !uploading ? 'var(--accent-blue)' : 'var(--glass-regular)',
                  color: file && !uploading ? 'white' : 'var(--text-quaternary)',
                  boxShadow: file && !uploading ? '0 4px 16px rgba(10, 132, 255, 0.35)' : 'none',
                  cursor: !file || uploading ? 'not-allowed' : 'pointer',
                  opacity: !file || uploading ? 0.6 : 1,
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import to Database
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvUploader;
