'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/react';

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMutation = trpc.dataExport.exportData.useQuery(undefined, {
    enabled: false,
  });

  const importMutation = trpc.dataExport.importData.useMutation();
  const utils = trpc.useUtils();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportMutation.refetch();

      if (data.data) {
        // Create JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `degixhub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();

      const result = await importMutation.mutateAsync({
        data: text,
        mode: importMode,
        skipDuplicates,
      });

      setImportResult(result);

      // Invalidate all data queries to refresh
      await Promise.all([
        utils.links.getAll.invalidate(),
        utils.credentials.getAll.invalidate(),
        utils.tags.getAll.invalidate(),
      ]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(error.message || 'Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Data Management
      </h2>

      <div className="space-y-6">
        {/* Export Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Export Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download all your links, credentials, and tags as a JSON file. This file is encrypted
            with your credentials and can be imported later.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Import Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Import Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Import data from a previously exported JSON file. Choose whether to merge with existing
            data or replace everything.
          </p>

          {/* Import Options */}
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Import Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Merge (keep existing data)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Replace (delete all existing data)
                  </span>
                </label>
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Skip duplicates (recommended)
              </span>
            </label>
          </div>

          {/* File Input */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 cursor-pointer flex items-center gap-2 ${
                isImporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {isImporting ? 'Importing...' : 'Choose File to Import'}
            </label>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                Import Successful!
              </h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>Links imported: {importResult.linksImported}</li>
                <li>Credentials imported: {importResult.credentialsImported}</li>
                <li>Tags imported: {importResult.tagsImported}</li>
                {importResult.skipped > 0 && <li>Skipped duplicates: {importResult.skipped}</li>}
                {importResult.errors.length > 0 && (
                  <li className="text-red-600 dark:text-red-400">
                    Errors: {importResult.errors.length}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Warning for Replace Mode */}
          {importMode === 'replace' && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                Warning: Replace mode will delete ALL your existing data before importing!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
