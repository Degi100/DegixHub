'use client';

import { useEffect, useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/react';
import { copySecureToClipboard } from '@/lib/clipboard';
import styles from './command-palette.module.css';

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

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
}

type SearchResult =
  | { type: 'credential'; item: Credential }
  | { type: 'link'; item: Link }
  | { type: 'note'; item: Note };

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  links: Link[];
  credentials: Credential[];
  notes?: Note[];
  onNavigateToNote?: (noteId: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  links,
  credentials,
  notes = [],
  onNavigateToNote,
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
        ...notes.map((n) => ({ type: 'note' as const, item: n })),
      ];
      setResults(allResults.slice(0, 15));
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

    // Search notes
    notes.forEach((note) => {
      const searchText = `${note.title} ${note.content} ${note.category}`.toLowerCase();
      if (searchText.includes(lowerQuery)) {
        searchResults.push({ type: 'note', item: note });
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

  // Copy credential when data is fetched (with auto-clear after 30s)
  useEffect(() => {
    if (viewedCredential && viewingCredentialId) {
      copySecureToClipboard(viewedCredential.data);
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
    } else if (result.type === 'note') {
      // Navigate to notes section
      onNavigateToNote?.(result.item.id);
      onClose();
    } else {
      // Open link in new tab
      window.open(result.item.url, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'credential') {
      return (
        <svg className={`${styles.resultIcon} ${styles.iconCredential}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    if (result.type === 'note') {
      return (
        <svg className={`${styles.resultIcon} ${styles.iconNote}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    return (
      <svg className={`${styles.resultIcon} ${styles.iconLink}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  };

  const getResultAction = (result: SearchResult) => {
    if (result.type === 'credential') {
      return (
        <span className={styles.resultAction}>
          {copiedId === result.item.id ? '✓ Copied' : 'Copy'}
        </span>
      );
    }
    if (result.type === 'note') {
      return (
        <span className={styles.resultAction}>View</span>
      );
    }
    return (
      <span className={styles.resultAction}>Open</span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Search Input */}
        <div className={styles.searchBox}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search credentials and links..."
            className={styles.searchInput}
          />
        </div>

        {/* Results */}
        <div className={styles.results}>
          {results.length > 0 ? (
            <div className={styles.resultsList}>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.item.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`${styles.resultItem} ${index === selectedIndex ? styles.resultItemSelected : ''}`}
                >
                  {getResultIcon(result)}
                  <div className={styles.resultContent}>
                    <div className={styles.resultName}>
                      {result.type === 'note' ? result.item.title : result.item.name}
                    </div>
                    <div className={styles.resultMeta}>
                      <span className={styles.categoryBadge}>
                        {result.item.category}
                      </span>
                      {result.type !== 'note' && result.item.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className={styles.tagBadge}
                          style={{ backgroundColor: `${tag.color}30`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {result.type === 'note' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }}>
                          {result.item.content.substring(0, 40)}...
                        </span>
                      )}
                    </div>
                  </div>
                  {getResultAction(result)}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.shortcuts}>
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
