'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/react';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const importMutation = trpc.dataExport.importData.useMutation();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      console.log('Starting export...');

      // Call the export query directly using utils
      const data = await utils.client.dataExport.exportData.query();
      console.log('Data fetched:', data);

      if (data) {
        const jsonContent = JSON.stringify(data.data, null, 2);
        const suggestedName = `degixhub-backup-${new Date().toISOString().split('T')[0]}.json`;

        // Check if File System Access API is supported
        const hasFileSystemAPI = 'showSaveFilePicker' in window;
        console.log('File System API supported:', hasFileSystemAPI);

        // Use File System Access API for modern browsers
        if (hasFileSystemAPI) {
          try {
            console.log('Opening save dialog...');
            const handle = await (window as any).showSaveFilePicker({
              suggestedName,
              types: [{
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] },
              }],
            });
            console.log('File handle received:', handle);
            const writable = await handle.createWritable();
            await writable.write(jsonContent);
            await writable.close();
            console.log('File written successfully');
            toast.success('Data exported successfully!');
          } catch (err: any) {
            console.error('File System API error:', err);
            // User cancelled the save dialog
            if (err.name === 'AbortError') {
              toast.info('Export cancelled');
            } else if (err.name === 'NotAllowedError') {
              // Brave or other privacy-focused browsers might block this
              console.log('File System API not allowed, falling back to download');
              // Fall back to download
              const blob = new Blob([jsonContent], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = suggestedName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success('Data exported successfully!');
            } else {
              throw err;
            }
          }
        } else {
          console.log('Using fallback download method');
          // Fallback for browsers that don't support File System Access API
          const blob = new Blob([jsonContent], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = suggestedName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Data exported successfully!');
        }
      } else {
        console.error('No data received from export mutation');
        toast.error('No data to export');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      toast.success('Data imported successfully!');
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error(error.message || 'Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Data Management</h2>

      {/* Export Section */}
      <div className="border rounded-lg bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Export Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download all your links, credentials, and tags as a JSON file. This file contains encrypted
            credentials and can be imported later.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </Button>
      </div>

      {/* Import Section */}
      <div className="border rounded-lg bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Import Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Import data from a previously exported JSON file. Choose whether to merge with existing
            data or replace everything.
          </p>
        </div>

        {/* Import Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Import Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="mr-2"
                />
                <span className="text-sm">
                  Merge (keep existing data)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="mr-2"
                />
                <span className="text-sm">
                  Replace (delete all existing data)
                </span>
              </label>
            </div>
          </div>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">
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
          <Button
            variant="secondary"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Choose File to Import'}
          </Button>
        </div>

        {/* Warning for Replace Mode */}
        {importMode === 'replace' && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium">
              Warning: Replace mode will delete ALL your existing data before importing!
            </p>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
              Import Successful!
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Links imported: {importResult.linksImported}</li>
              <li>• Credentials imported: {importResult.credentialsImported}</li>
              <li>• Tags imported: {importResult.tagsImported}</li>
              {importResult.skipped > 0 && <li>• Skipped duplicates: {importResult.skipped}</li>}
              {importResult.errors.length > 0 && (
                <li className="text-red-600 dark:text-red-400">
                  • Errors: {importResult.errors.length}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
