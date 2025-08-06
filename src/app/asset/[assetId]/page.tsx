
"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import * as FirestoreService from '@/lib/firestore-service';
import type { Asset } from '@/data/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CameraOff, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

type MediaItem = {
  type: 'image' | 'video';
  url: string;
};

export default function AssetViewerPage() {
    const params = useParams();
    const assetId = params.assetId as string;
    const { t } = useLanguage();

    const [asset, setAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const mediaItems: MediaItem[] = useMemo(() => {
      if (!asset) return [];
      const photos = (asset.photos || []).map(url => ({ type: 'image' as const, url }));
      const videos = (asset.videos || []).map(url => ({ type: 'video' as const, url }));
      return [...photos, ...videos];
    }, [asset]);

    const handleNextMedia = useCallback(() => {
      if (mediaItems.length > 1) {
        setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
      }
    }, [mediaItems.length]);
  
    const handlePrevMedia = useCallback(() => {
      if (mediaItems.length > 1) {
        setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + mediaItems.length) % mediaItems.length);
      }
    }, [mediaItems.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'ArrowRight') {
            handleNextMedia();
          } else if (event.key === 'ArrowLeft') {
            handlePrevMedia();
          }
        };
    
        window.addEventListener('keydown', handleKeyDown);
    
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [handleNextMedia, handlePrevMedia]);


    useEffect(() => {
        if (assetId) {
            const fetchAsset = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const fetchedAsset = await FirestoreService.getAssetById(assetId);
                    if (fetchedAsset) {
                        setAsset(fetchedAsset);
                    } else {
                        setError('Asset not found.');
                    }
                } catch (e) {
                    console.error("Failed to fetch asset", e);
                    setError('Failed to load asset details.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAsset();
        }
    }, [assetId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-lg text-muted-foreground mt-4">Loading Asset...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-destructive/10">
                <p className="text-lg text-destructive">{error}</p>
            </div>
        );
    }
    
    if (!asset) {
        return null; // Should be covered by error state, but as a fallback.
    }
    
    const currentMedia = mediaItems.length > 0 ? mediaItems[currentMediaIndex] : null;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold font-headline text-primary">{asset.name}</CardTitle>
                        <CardDescription>
                            {t('assetDetailsForReview', 'Asset Details (Review Mode)')}
                        </CardDescription>
                        {asset.serialNumber && (
                           <p className="text-sm text-muted-foreground pt-1">
                                {t('serialNumberLabel', 'Serial Number')}: {asset.serialNumber}
                           </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {currentMedia ? (
                             <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border shadow-inner group">
                                {currentMedia.type === 'image' ? (
                                    <Image
                                        key={currentMedia.url}
                                        src={currentMedia.url}
                                        alt={t('assetPhotoAlt', `Photo of ${asset.name}`, { assetName: asset.name })}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <video
                                        key={currentMedia.url}
                                        src={currentMedia.url}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain bg-black"
                                    />
                                )}
                                {mediaItems.length > 1 && (
                                <>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); handlePrevMedia(); }}
                                    >
                                    <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); handleNextMedia(); }}
                                    >
                                    <ArrowRight className="h-6 w-6" />
                                    </Button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-medium rounded-full px-2.5 py-1 pointer-events-none">
                                    {currentMediaIndex + 1} / {mediaItems.length}
                                    </div>
                                </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed bg-muted text-muted-foreground">
                                <CameraOff className="w-24 h-24" />
                                <p className="mt-4 text-lg">No media available for this asset.</p>
                            </div>
                        )}
                         {(asset.textDescription || asset.voiceDescription) && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                               {asset.textDescription && (
                                 <div className="space-y-2">
                                     <h3 className="text-lg font-semibold text-foreground/90">{t('textDescriptionLabel', 'Written Description')}</h3>
                                     <p className="text-sm text-foreground whitespace-pre-wrap p-3 border rounded-md bg-muted/50">
                                         {asset.textDescription}
                                     </p>
                                 </div>
                               )}
                               {asset.voiceDescription && (
                                   <div className="space-y-2">
                                       <h3 className="text-lg font-semibold text-foreground/90">{t('voiceDescriptionLabel', 'Voice Description')} (Transcript)</h3>
                                       <p className="text-sm text-foreground whitespace-pre-wrap p-3 border rounded-md bg-muted/50">
                                           {asset.voiceDescription}
                                       </p>
                                   </div>
                               )}
                            </div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
