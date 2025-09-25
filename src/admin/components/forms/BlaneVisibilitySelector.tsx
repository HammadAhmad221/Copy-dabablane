import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CheckIcon, CopyIcon, LinkIcon, EyeOffIcon, GlobeIcon, InfoIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select';
import { Input } from '@/admin/components/ui/input';
import { blaneApi } from '@/admin/lib/api/services/blaneService';
import { Alert, AlertDescription } from '@/admin/components/ui/alert';

type VisibilityType = 'private' | 'public' | 'link';

interface BlaneVisibilitySelectorProps {
  blaneId: string | undefined;
  initialVisibility?: VisibilityType;
  initialShareToken?: string;
  initialShareUrl?: string;
  onChange?: (visibility: VisibilityType, shareToken?: string, shareUrl?: string) => void;
}

const BlaneVisibilitySelector: React.FC<BlaneVisibilitySelectorProps> = ({
  blaneId,
  initialVisibility = 'private',
  initialShareToken,
  initialShareUrl,
  onChange,
}) => {
  const [visibility, setVisibility] = useState<VisibilityType>(initialVisibility);
  const [shareToken, setShareToken] = useState<string>(initialShareToken || '');
  const [shareUrl, setShareUrl] = useState<string>(initialShareUrl || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const isNewBlane = !blaneId;

  useEffect(() => {
    // For existing blanes with a token, use the initial share URL if provided
    if (initialShareUrl && visibility === 'link') {
      setShareUrl(initialShareUrl);
    }
  }, [visibility, initialShareUrl]);

  const handleVisibilityChange = async (value: string) => {
    const newVisibility = value as VisibilityType;
    
    setVisibility(newVisibility);
    
    // For new blanes without an ID, just update the local state
    if (!blaneId) {
      if (onChange) {
        onChange(newVisibility, newVisibility === 'link' ? shareToken : undefined, undefined);
      }
      return;
    }
    
    // For existing blanes with an ID, make the API calls
    setLoading(true);
    try {
      if (newVisibility === 'link') {
        // Generate share link
        const response = await blaneApi.generateShareLink(blaneId);
        if (response?.data?.data) {
          const { share_token, share_url } = response.data.data;
          setShareToken(share_token);
          setShareUrl(share_url);
          if (onChange) {
            onChange(newVisibility, share_token, share_url);
          }
          toast.success('Share link generated successfully');
        }
      } else if (newVisibility === 'private') {
        // Revoke share link
        await blaneApi.revokeShareLink(blaneId);
        setShareToken('');
        setShareUrl('');
        if (onChange) {
          onChange(newVisibility, undefined, undefined);
        }
        toast.success('Share link revoked');
      } else {
        // Public visibility
        await blaneApi.updateVisibility(blaneId, 'public');
        if (onChange) {
          onChange(newVisibility, undefined, undefined);
        }
        toast.success('Blane is now public');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const regenerateShareLink = async () => {
    if (!blaneId) {
      toast.error('Cannot regenerate link for unsaved blane');
      return;
    }
    
    setLoading(true);
    try {
      const response = await blaneApi.generateShareLink(blaneId);
      if (response?.data?.data) {
        const { share_token, share_url } = response.data.data;
        setShareToken(share_token);
        setShareUrl(share_url);
        if (onChange) {
          onChange('link', share_token, share_url);
        }
        toast.success('Share link regenerated successfully');
      }
    } catch (error) {
      console.error('Error regenerating share link:', error);
      toast.error('Failed to regenerate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy link');
      });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-full">
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
            Visibility
          </label>
          <Select
            disabled={loading}
            value={visibility}
            onValueChange={handleVisibilityChange}
          >
            <SelectTrigger className="w-full" id="visibility">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center">
                  <EyeOffIcon className="mr-2 h-4 w-4" />
                  <span>Private (Only you)</span>
                </div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center">
                  <GlobeIcon className="mr-2 h-4 w-4" />
                  <span>Public (Anyone)</span>
                </div>
              </SelectItem>
              <SelectItem value="link">
                <div className="flex items-center">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <span>Restricted (Anyone with the link)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibility === 'link' && isNewBlane && (
        <Alert variant="info" className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Share link will be generated after saving the blane. Save the blane first to generate a shareable link.
          </AlertDescription>
        </Alert>
      )}

      {visibility === 'link' && !isNewBlane && (
        <>
          <div className="flex flex-col">
            <label htmlFor="share_token" className="block text-xs font-medium text-gray-500 mb-1">
              Share Token (Saved in database)
            </label>
            <Input
              id="share_token"
              value={shareToken}
              readOnly
              className="font-mono text-xs bg-gray-50"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="share_url" className="block text-xs font-medium text-gray-500 mb-1">
              Share URL
            </label>
            <div className="flex items-center space-x-2">
              <Input
                id="share_url"
                value={shareUrl}
                readOnly
                placeholder={loading ? 'Generating share link...' : 'Share link will appear here'}
                className="flex-grow"
              />
              <Button
                type="button"
                onClick={copyToClipboard}
                disabled={loading || !shareUrl}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={regenerateShareLink}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            {shareToken ? 'Regenerate Link' : 'Generate Link'}
          </Button>
        </>
      )}
    </div>
  );
};

export default BlaneVisibilitySelector; 