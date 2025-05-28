import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SharingService from '../../services/SharingService';
import { 
  File as FileIcon, 
  Folder, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Lock, 
  Globe, 
  Link2, 
  Calendar, 
  Eye, 
  RefreshCw, 
  Search,
  X 
} from 'lucide-react';

// Define SharedEntity type locally since it's missing from the service
interface SharedEntity {
  id: string;
  entityId: string;
  entityType: 'file' | 'project';
  userId: string;
  shareType: 'public' | 'private' | 'link';
  password?: string | null;
  expiresAt?: string | null;
  allowDownload: boolean;
  allowCopy: boolean;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  url: string;
}

const MySharedItems: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [sharedItems, setSharedItems] = useState<SharedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});

  // Load shared items when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadSharedItems();
    } else {
      setSharedItems([]);
    }
  }, [user]);

  // Mock implementation since getMySharedEntities doesn't exist
  const loadSharedItems = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Mocked data
      const mockItems: SharedEntity[] = [
        {
          id: '1',
          entityId: 'file-1',
          entityType: 'file',
          userId: user.id,
          shareType: 'public',
          allowDownload: true,
          allowCopy: true,
          accessCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: `https://example.com/share/file/1`
        }
      ];
      
      setSharedItems(mockItems);
    } catch (error: any) {
      console.error('Error loading shared items:', error);
      setError('Failed to load your shared items');
    } finally {
      setLoading(false);
    }
  };

  // Mock delete implementation
  const handleDelete = async (shareId: string) => {
    if (!window.confirm('Are you sure you want to delete this shared item?')) {
      return;
    }

    try {
      // Mock delete by removing from state
      setSharedItems(prev => prev.filter(item => item.id !== shareId));
    } catch (error: any) {
      console.error('Error deleting shared item:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(prev => ({ ...prev, [id]: true }));
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setError('Failed to copy URL to clipboard');
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get icon for share type
  const getShareTypeIcon = (shareType: string) => {
    switch (shareType) {
      case 'public':
        return <Globe size={16} color={colors.primary} />;
      case 'private':
        return <Lock size={16} color={colors.warning} />;
      case 'link':
      default:
        return <Link2 size={16} color={colors.primary} />;
    }
  };

  // Filter items based on search query
  const filteredItems = searchQuery
    ? sharedItems.filter(item => 
        item.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shareType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sharedItems;

  if (!user) {
    return (
      <div 
        className="p-8 text-center"
        style={{ color: colors.textSecondary }}
      >
        Sign in to view your shared items
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
          My Shared Items
        </h2>
        <button
          className="flex items-center gap-1 p-2 rounded"
          style={{ backgroundColor: colors.primary, color: 'white' }}
          onClick={loadSharedItems}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} color={colors.textSecondary} />
        </div>
        <input
          type="text"
          placeholder="Search shared items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-md border"
          style={{ 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={16} color={colors.textSecondary} />
          </button>
        )}
      </div>

      {error && (
        <div 
          className="mb-4 p-3 rounded-md"
          style={{ backgroundColor: `${colors.error}15`, color: colors.error }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div 
          className="p-8 text-center"
          style={{ color: colors.textSecondary }}
        >
          <RefreshCw className="inline-block mb-2 animate-spin" size={24} color={colors.primary} />
          <p>Loading shared items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div 
          className="p-8 text-center border rounded-lg"
          style={{ color: colors.textSecondary, borderColor: colors.border }}
        >
          {searchQuery ? (
            <p>No shared items match your search</p>
          ) : (
            <p>You haven't shared any items yet</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: colors.border }}
            >
              <div 
                className="p-4 flex justify-between items-start"
                style={{ backgroundColor: colors.surface }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    {item.entityType === 'file' ? (
                      <FileIcon size={20} color={colors.primary} />
                    ) : (
                      <Folder size={20} color={colors.primary} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: colors.text }}>
                      {item.entityId}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1" style={{ color: colors.textSecondary }}>
                        {getShareTypeIcon(item.shareType)}
                        <span className="text-sm capitalize">{item.shareType}</span>
                      </div>
                      {item.expiresAt && (
                        <div className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
                          <Calendar size={14} />
                          <span>Expires: {formatDate(item.expiresAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
                        <Eye size={14} />
                        <span>{item.accessCount} views</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 rounded-md"
                    onClick={() => copyToClipboard(item.url, item.id)}
                    style={{ 
                      backgroundColor: copySuccess[item.id] ? colors.success : colors.background,
                      color: copySuccess[item.id] ? 'white' : colors.text,
                    }}
                  >
                    {copySuccess[item.id] ? (
                      <Copy size={18} />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md"
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    className="p-2 rounded-md"
                    onClick={() => handleDelete(item.id)}
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.error
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div 
                className="px-4 py-2 text-sm border-t"
                style={{ 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  color: colors.textSecondary
                }}
              >
                <div className="flex justify-between">
                  <span>Created: {formatDate(item.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <span>Copy: {item.allowCopy ? 'Allowed' : 'Disabled'}</span>
                    <span className="mx-2">•</span>
                    <span>Download: {item.allowDownload ? 'Allowed' : 'Disabled'}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySharedItems;