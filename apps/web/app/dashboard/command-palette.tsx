'use client';

import { useEffect, useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Link {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  tags: Tag[];
}

interface Credential {
  id: string;
  name: string;
  category: string;
  tags: Tag[];
}

type SearchResult =
  | { type: 'credential'; item: Credential }
  | { type: 'link'; item: Link };

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  links: Link[];
  credentials: Credential[];
}

export function CommandPalette({
  isOpen,
  onClose,
  links,
  credentials,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch credential data when viewing
  const [viewingCredentialId, setViewingCredentialId] = useState<string | null>(null);
  const { data: viewedCredential } = trpc.credentials.getById.useQuery(
    { id: viewingCredentialId! },
    { enabled: !!viewingCredentialId }
  );

  // Fuzzy search function
  const fuzzySearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Show all results when query is empty
      const allResults: SearchResult[] = [
        ...credentials.map((c) => ({ type: 'credential' as const, item: c })),
        ...links.map((l) => ({ type: 'link' as const, item: l })),
      ];
      setResults(allResults.slice(0, 10));
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search credentials
    credentials.forEach((cred) => {
      const searchText = `${cred.name} ${cred.category} ${cred.tags.map((t) => t.name).join(' ')}`.toLowerCase();
      if (searchText.includes(lowerQuery)) {
        searchResults.push({ type: 'credential', item: cred });
      }
    });

    // Search links
    links.forEach((link) => {
      const searchText = `${link.name} ${link.url} ${link.category} ${link.description || ''} ${link.tags.map((t) => t.name).join(' ')}`.toLowerCase();
      if (searchText.includes(lowerQuery)) {
        searchResults.push({ type: 'link', item: link });
      }
    });

    setResults(searchResults.slice(0, 10));
  };

  // Update search results when query changes
  useEffect(() => {
    fuzzySearch(query);
    setSelectedIndex(0);
  }, [query, credentials, links]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      fuzzySearch('');
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Copy credential when data is fetched
  useEffect(() => {
    if (viewedCredential && viewingCredentialId) {
      navigator.clipboard.writeText(viewedCredential.data);
      setCopiedId(viewingCredentialId);
      setTimeout(() => setCopiedId(null), 2000);
      setViewingCredentialId(null);
      onClose();
    }
  }, [viewedCredential, viewingCredentialId]);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'credential') {
      // Copy credential to clipboard
      setViewingCredentialId(result.item.id);
    } else {
      // Open link in new tab
      window.open(result.item.url, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'credential') {
      return (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  };

  const getResultAction = (result: SearchResult) => {
    if (result.type === 'credential') {
      return (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {copiedId === result.item.id ? '✓ Copied' : 'Copy'}
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">Open</span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center pt-4">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-border">
        {/* Search Input */}
        <div className="p-3 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search credentials and links..."
            className="w-full px-3 py-2 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
          />
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.item.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors ${
                    index === selectedIndex ? 'bg-muted' : ''
                  }`}
                >
                  {getResultIcon(result)}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
                      {result.item.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                        {result.item.category}
                      </span>
                      {result.item.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{ backgroundColor: `${tag.color}30`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {getResultAction(result)}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div>
            {results.length} results
          </div>
        </div>
      </div>
    </div>
  );
}
