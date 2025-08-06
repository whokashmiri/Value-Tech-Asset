
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import * as FirestoreService from '@/lib/firestore-service';
import type { Asset } from '@/data/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CameraOff } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

export default function AssetViewerPage() {
    const params = useParams();
    const assetId = params.assetId as string;
    const { t } = useLanguage();

    const [asset, setAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const allMedia = [
        ...(asset.photos || []).map(url => ({ type: 'image', url })),
        ...(asset.videos || []).map(url => ({ type: 'video', url }))
    ];

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
                        {allMedia.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {allMedia.map((media, index) => (
                                    <a 
                                        key={index}
                                        href={media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block relative aspect-square w-full h-full rounded-lg overflow-hidden border shadow-md hover:shadow-xl transition-shadow"
                                    >
                                        {media.type === 'image' ? (
                                            <Image
                                                src={media.url}
                                                alt={`Asset media ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            />
                                        ) : (
                                            <video
                                                src={media.url}
                                                controls={false}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-sm font-semibold">View Full Size</p>
                                        </div>
                                    </a>
                                ))}
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
