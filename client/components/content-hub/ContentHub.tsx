/**
 * ContentHub Component
 *
 * Unified view of all content (copy, images, videos) for a brand.
 * Supports mode-aware actions for cross-mode content generation.
 */

import { useState, useEffect, useCallback } from 'react';
import { FileText, Image, Film, Link2, Sparkles, RefreshCw, Search, Filter } from 'lucide-react';
import { useContentHub, type UnifiedContentItem, type ContentHubItemType } from '../../hooks/useContentHub';

interface ContentHubProps {
  brandId: string;
  currentMode: 'copywriting' | 'media';
  onGenerateFromCopy?: (copyId: string, copyText: string) => void;
  onUseAsReference?: (item: UnifiedContentItem) => void;
}

type FilterTab = 'all' | 'copy' | 'image' | 'video';

export function ContentHub({ brandId, currentMode, onGenerateFromCopy, onUseAsReference }: ContentHubProps) {
  const [content, setContent] = useState<UnifiedContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { fetchAllContent, isLoading } = useContentHub();

  const loadContent = useCallback(async () => {
    setIsRefreshing(true);
    const typeFilter = activeTab === 'all' ? undefined : activeTab as ContentHubItemType;
    const items = await fetchAllContent(brandId, typeFilter);
    setContent(items);
    setIsRefreshing(false);
  }, [brandId, activeTab, fetchAllContent]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const filteredContent = content.filter(item => {
    if (!searchQuery) return true;
    return item.content_preview.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getItemIcon = (type: ContentHubItemType) => {
    switch (type) {
      case 'copy':
        return <FileText className="size-4" />;
      case 'image':
        return <Image className="size-4" />;
      case 'video':
        return <Film className="size-4" />;
    }
  };

  const getItemTypeLabel = (type: ContentHubItemType) => {
    switch (type) {
      case 'copy':
        return 'Copy';
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'published':
        return 'bg-green-500/20 text-green-400';
      case 'processing':
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderActions = (item: UnifiedContentItem) => {
    if (currentMode === 'media' && item.type === 'copy') {
      return (
        <button
          onClick={() => onGenerateFromCopy?.(item.id, item.content_preview)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30 transition"
        >
          <Sparkles className="size-3" />
          Generate Media
        </button>
      );
    }

    if (currentMode === 'copywriting' && (item.type === 'image' || item.type === 'video')) {
      return (
        <button
          onClick={() => onUseAsReference?.(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition"
        >
          <Link2 className="size-3" />
          Use as Reference
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Content Hub</h2>
        <button
          onClick={loadContent}
          disabled={isRefreshing}
          className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {(['all', 'copy', 'image', 'video'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab
                ? 'text-white border-b-2 border-purple-500 bg-gray-800/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            {tab === 'all' ? 'All' : getItemTypeLabel(tab as ContentHubItemType)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && content.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="size-8 text-gray-500 animate-spin" />
              <span className="text-sm text-gray-500">Loading content...</span>
            </div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <Filter className="size-8 text-gray-500" />
              <span className="text-sm text-gray-500">
                {searchQuery ? 'No matching content found' : 'No content yet'}
              </span>
            </div>
          </div>
        ) : (
          filteredContent.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail or Icon */}
                <div className="flex-shrink-0">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      className="w-16 h-16 rounded-md object-cover bg-gray-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-gray-700 flex items-center justify-center">
                      {getItemIcon(item.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                      {getItemTypeLabel(item.type)}
                    </span>
                    {item.platform && (
                      <span className="text-xs text-gray-500">{item.platform}</span>
                    )}
                    {item.status && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{item.content_preview}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                    {item.linked_items && item.linked_items.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Link2 className="size-3" />
                        {item.linked_items.length} linked
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {renderActions(item)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
