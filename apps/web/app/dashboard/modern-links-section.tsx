'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Star,
  ExternalLink,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  Link as LinkIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  isPinned?: boolean | null;
  createdAt: string;
  tags: Tag[];
}

interface ModernLinksSectionProps {
  links: Link[] | undefined;
  tags: Tag[];
  onCreateLink: (data: any) => void;
  onUpdateLink: (data: any) => void;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function ModernLinksSection({
  links,
  tags,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onTogglePin,
}: ModernLinksSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredLinks = links
    ?.filter((link) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        link.name.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query) ||
        link.category.toLowerCase().includes(query);

      const matchesCategory = !selectedCategory || link.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories = Array.from(new Set(links?.map((l) => l.category) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Links</h2>
          <p className="text-muted-foreground">Manage and organize your important links</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  showFilters && 'rotate-180'
                )}
              />
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <Badge
                    variant={!selectedCategory ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory('')}
                  >
                    All
                  </Badge>
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Links Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredLinks && filteredLinks.length > 0 ? (
            filteredLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate flex items-center gap-2">
                            {link.name}
                            {link.isPinned && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate">
                            {link.category}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onTogglePin(link.id)}
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            link.isPinned
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {link.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {link.description}
                      </p>
                    )}

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
                    >
                      <span className="truncate">{new URL(link.url).hostname}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>

                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {link.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                              borderColor: tag.color,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Delete this link?')) {
                            onDeleteLink(link.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full"
            >
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No links found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || selectedCategory
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first link'}
                  </p>
                  {!searchQuery && !selectedCategory && (
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Link
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
