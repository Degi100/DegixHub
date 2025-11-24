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
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Key,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  createdAt: string;
  tags: Tag[];
}

interface ModernCredentialsSectionProps {
  credentials: Credential[] | undefined;
  tags: Tag[];
  onCreateCredential: (data: any) => void;
  onUpdateCredential: (data: any) => void;
  onDeleteCredential: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function ModernCredentialsSection({
  credentials,
  tags,
  onCreateCredential,
  onUpdateCredential,
  onDeleteCredential,
  onTogglePin,
}: ModernCredentialsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${name} copied to clipboard`, {
      icon: <CheckCircle2 className="h-4 w-4" />,
    });
  };

  const filteredCredentials = credentials
    ?.filter((cred) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        cred.name.toLowerCase().includes(query) ||
        cred.category.toLowerCase().includes(query);

      const matchesCategory = !selectedCategory || cred.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories = Array.from(new Set(credentials?.map((c) => c.category) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Credentials</h2>
          <p className="text-muted-foreground">
            Securely manage your passwords and API keys
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Credential
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
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
          )}
        </CardContent>
      </Card>

      {/* Credentials Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredCredentials && filteredCredentials.length > 0 ? (
            filteredCredentials.map((cred, index) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative overflow-hidden">
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardHeader className="pb-3 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate flex items-center gap-2">
                            {cred.name}
                            {cred.isPinned && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate">
                            {cred.category}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onTogglePin(cred.id)}
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            cred.isPinned
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 relative">
                    {/* Encrypted Badge */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-md border border-green-500/20">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        AES-256 Encrypted
                      </span>
                    </div>

                    {/* Tags */}
                    {cred.tags && cred.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cred.tags.map((tag) => (
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

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => toggleReveal(cred.id)}
                      >
                        {revealedIds.has(cred.id) ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            View
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => copyToClipboard('***', cred.name)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Delete this credential?')) {
                            onDeleteCredential(cred.id);
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
                  <Key className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No credentials found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || selectedCategory
                      ? 'Try adjusting your filters'
                      : 'Securely store your first credential'}
                  </p>
                  {!searchQuery && !selectedCategory && (
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Credential
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
