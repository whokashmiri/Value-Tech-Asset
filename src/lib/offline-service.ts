

import { 
  addFolder as addFolderToDb, 
  addAsset as addAssetToDb, 
  updateProject, 
  updateAsset as updateAssetInDb,
  updateFolder as updateFolderInDb,
  getProjectById,
  getAllAssetsForProject,
  getFolders as getFoldersFromFirestore,
  deleteFolderCascade as deleteFolderInDb,
  deleteAsset as deleteAssetInDb,
} from './firestore-service';
import type { Folder, Asset, Project, ProjectStatus } from '@/data/mock-data';
import { v4 as uuidv4 } from 'uuid';
import Dexie, { type EntityTable } from 'dexie';

const OFFLINE_QUEUE_KEY = 'offlineQueue-v3';

// --- Dexie (IndexedDB) Setup ---
interface OfflineProjectData extends Project {
  isCached: true;
  downloadedAt: number;
}
interface OfflineFolder extends Folder { isCached: true; }
interface OfflineAsset extends Asset { isCached: true; }

const db = new Dexie('AssetInspectorDB-v4') as Dexie & {
  projects: EntityTable<OfflineProjectData, 'id'>;
  folders: EntityTable<OfflineFolder, 'id'>;
  assets: EntityTable<OfflineAsset, 'id'>;
};

// Added companyName to projects index for offline company listing
db.version(4).stores({
  projects: '&id, companyId, companyName, downloadedAt',
  folders: '&id, projectId, parentId',
  assets: '&id, projectId, folderId, name_lowercase, serialNumber'
});

export type OfflineAction = 
  | { type: 'add-project'; payload: Omit<Project, 'id' | 'createdAt' | 'lastAccessed'>; localId: string; projectId: string; }
  | { type: 'add-folder'; payload: Omit<Folder, 'id' | 'isOffline'>; localId: string; projectId: string }
  | { type: 'add-asset'; payload: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'isOffline' | 'isUploading'>; localId: string; projectId: string }
  | { type: 'update-asset'; payload: Partial<Asset>; assetId: string; projectId: string }
  | { type: 'update-folder'; payload: Partial<Folder>; folderId: string; projectId: string }
  | { type: 'delete-folder'; folderId: string; projectId: string; }
  | { type: 'delete-asset'; assetId: string; projectId: string; };

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
  return queueJson ? JSON.parse(queueJson) : [];
}

function saveOfflineQueue(queue: OfflineAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function queueOfflineAction(
  type: OfflineAction['type'], 
  payload: any, 
  projectId: string,
  itemId?: string
): { localId?: string, itemId?: string } {

  const queue = getOfflineQueue();
  
  const { isOffline, isUploading, isOfflineUpdate, ...restPayload } = payload;
  
  let action: OfflineAction;
  let returnVal: { localId?: string, itemId?: string } = {};

  switch (type) {
    case 'add-project':
    case 'add-folder':
    case 'add-asset':
      const localId = `local_${uuidv4()}`;
      action = { type, payload: restPayload, localId, projectId } as OfflineAction;
      returnVal.localId = localId;
      break;
    case 'update-asset':
    case 'update-folder':
    case 'delete-asset':
    case 'delete-folder':
      if (!itemId) {
        console.error(`ItemID is required for ${type} action.`);
        return {};
      }
      const key = type.includes('asset') ? 'assetId' : 'folderId';
      action = { type, payload: restPayload, [key]: itemId, projectId } as OfflineAction;
      returnVal.itemId = itemId;
      break;
    default:
      console.error(`Invalid action type for queueOfflineAction: ${type}`);
      return {};
  }
  
  queue.push(action);
  saveOfflineQueue(queue);

  updateProject(projectId, { status: 'recent' as ProjectStatus }).catch(e => console.error("Failed to update project status optimistically", e));

  return returnVal;
}

export async function syncOfflineActions(): Promise<{syncedCount: number, errorCount: number}> {
    let queue = getOfflineQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, errorCount: 0 };
    }
  
    let syncedCount = 0;
    let errorCount = 0;
    
    const remainingActions: OfflineAction[] = [];
  
    for (const action of queue) {
      let success = false;
      try {
        switch(action.type) {
          case 'add-project':
            // You will need a function to add a project from the queue
            // success = await addProjectFromQueue(action.payload);
            break;
          case 'add-folder': {
            const createdFolder = await addFolderToDb(action.payload, action.localId);
            success = !!createdFolder;
            // Keep IndexedDB cache in sync
            if (success && createdFolder) {
              const isProjectCached = await isProjectOffline(action.projectId);
              if (isProjectCached) {
                await db.folders.put({ ...createdFolder, isCached: true });
              }
            }
            break;
          }
          case 'add-asset': {
            const assetPayload = { ...action.payload };
            if (assetPayload.photos && assetPayload.photos.length > 0) {
                const uploadPromises = assetPayload.photos.map(async (p: string, index: number) => {
                    if (p.startsWith('data:image')) {
                        const uploadedUrl = await uploadMediaViaApi(
                            p,
                            action.projectId,
                            action.localId || `asset-${index}`
                        );
                        return uploadedUrl ?? p;
                    }
                    return p;
                });
                assetPayload.photos = (await Promise.all(uploadPromises)).filter((p): p is string => p !== undefined);
            }
            const createdAsset = await addAssetToDb(assetPayload);
            success = !!createdAsset;
            // Keep IndexedDB cache in sync
            if (success && createdAsset) {
              const isProjectCached = await isProjectOffline(action.projectId);
              if (isProjectCached) {
                await db.assets.put({ ...createdAsset, isCached: true });
              }
            }
            break;
          }
          case 'update-asset': {
            const assetPayload = { ...action.payload };
            if (assetPayload.photos && assetPayload.photos.length > 0) {
                const uploadPromises = assetPayload.photos.map(async (p: string, index: number) => {
                    if (p.startsWith('data:image')) {
                        const uploadedUrl = await uploadMediaViaApi(
                            p,
                            action.projectId,
                            action.assetId || `asset-${index}`
                        );
                        return uploadedUrl ?? p;
                    }
                    return p;
                });
                assetPayload.photos = (await Promise.all(uploadPromises)).filter((p): p is string => p !== undefined);
            }
            success = await updateAssetInDb(action.assetId, assetPayload);
            // Keep IndexedDB cache in sync
            if (success) {
              const isProjectCached = await isProjectOffline(action.projectId);
              if (isProjectCached) {
                const existingAsset = await db.assets.get(action.assetId);
                if (existingAsset) {
                  await db.assets.put({ ...existingAsset, ...assetPayload, isCached: true });
                }
              }
            }
            break;
          }
          case 'update-folder': {
            success = await updateFolderInDb(action.folderId, action.payload);
            // Keep IndexedDB cache in sync
            if (success) {
              const isProjectCached = await isProjectOffline(action.projectId);
              if (isProjectCached) {
                const existingFolder = await db.folders.get(action.folderId);
                if (existingFolder) {
                  await db.folders.put({ ...existingFolder, ...action.payload, isCached: true });
                }
              }
            }
            break;
          }
          case 'delete-folder': {
            success = await deleteFolderInDb(action.folderId);
            // Keep IndexedDB cache in sync
            if (success) {
              const isProjectCached = await isProjectOffline(action.projectId);
              if (isProjectCached) {
                await db.folders.delete(action.folderId);
              }
            }
            break;
          }
          case 'delete-asset': {
            success = await deleteAssetInDb(action.assetId);
            // Keep IndexedDB cache in sync
            if (success) {
              const isProjectCached = await isProjectOffline(action.projectId);
              if (isProjectCached) {
                await db.assets.delete(action.assetId);
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to sync action:`, action, 'Error:', error);
      }

      if (success) {
        syncedCount++;
      } else {
        errorCount++;
        remainingActions.push(action);
      }
    }

    saveOfflineQueue(remainingActions);

    if(errorCount > 0){
      console.warn(`${errorCount} offline actions failed to sync and were re-queued.`);
    }

    return { syncedCount, errorCount };
}

export async function isProjectOffline(projectId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const project = await db.projects.get(projectId);
  return !!project;
}

export async function saveProjectForOffline(projectId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const [project, folders, assets] = await Promise.all([
    getProjectById(projectId),
    getFoldersFromFirestore(projectId),
    getAllAssetsForProject(projectId, 'all')
  ]);

  if (!project) {
    throw new Error("Project not found to save for offline use.");
  }

  const projectToCache: OfflineProjectData = { ...project, isCached: true, downloadedAt: Date.now() };
  const foldersToCache: OfflineFolder[] = folders.map(f => ({ ...f, isCached: true }));
  const assetsToCache: OfflineAsset[] = assets.map(a => ({ ...a, isCached: true }));

  await db.transaction('rw', db.projects, db.folders, db.assets, async () => {
    await db.folders.where({ projectId }).delete();
    await db.assets.where({ projectId }).delete();

    await db.projects.put(projectToCache);
    if (foldersToCache.length > 0) await db.folders.bulkPut(foldersToCache);
    if (assetsToCache.length > 0) await db.assets.bulkPut(assetsToCache);
  });
}

export async function addProjectOffline(project: Project): Promise<void> {
  if (typeof window === 'undefined') return;
  const projectToCache: OfflineProjectData = { ...project, isCached: true, downloadedAt: Date.now() };
  await db.projects.put(projectToCache);
}

/** Remove a project and all its folders/assets from IndexedDB. */
export async function removeProjectFromCache(projectId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.transaction('rw', db.projects, db.folders, db.assets, async () => {
    await db.projects.delete(projectId);
    await db.folders.where({ projectId }).delete();
    await db.assets.where({ projectId }).delete();
  });
}

/** Patch specific fields of a cached project without re-downloading everything. */
export async function updateProjectInCache(projectId: string, data: Partial<Project>): Promise<void> {
  if (typeof window === 'undefined') return;
  const existing = await db.projects.get(projectId);
  if (existing) {
    await db.projects.put({ ...existing, ...data });
  }
}

/** Returns the Set of all project IDs that are currently stored in IndexedDB. */
export async function getOfflineCachedProjectIds(): Promise<Set<string>> {
  if (typeof window === 'undefined') return new Set();
  const projects = await db.projects.toArray();
  return new Set(projects.map(p => p.id));
}

export async function getProjectDataFromCache(projectId: string): Promise<{ project: Project | null; folders: Folder[]; assets: Asset[] }> {
  if (typeof window === 'undefined') return { project: null, folders: [], assets: [] };

  const [project, folders, assets] = await Promise.all([
    db.projects.get(projectId),
    db.folders.where({ projectId }).toArray(),
    db.assets.where({ projectId }).toArray()
  ]);

  return { 
    project: (project as Project) || null, 
    folders, 
    assets 
  };
}

export async function getDownloadedProjectsFromCache(): Promise<Project[]> {
  if (typeof window === 'undefined') return [];
  const projects = await db.projects.toArray();
  // Ensure every project has a companyName, which is crucial for the offline selector.
  return projects.map(p => ({ ...p, companyName: p.companyName || 'Unknown Company' }));
}

export async function getAssetsFromCache(projectId: string): Promise<Asset[]> {
  if (typeof window === 'undefined') return [];
  return await db.assets.where({ projectId }).toArray();
}

export async function searchAssetsInCache(projectId: string, searchTerm: string): Promise<Asset[]> {
    if (typeof window === 'undefined' || !searchTerm.trim()) return [];

    const lowerCaseTerm = searchTerm.toLowerCase();
    const isSerialSearch = /^\d+(\.\d+)?$/.test(searchTerm.trim());

    try {
        let collection;
        if (isSerialSearch) {
            const serialNumber = Number(searchTerm.trim());
            collection = db.assets
                .where({ projectId: projectId, serialNumber: serialNumber });
        } else {
            collection = db.assets
                .where('name_lowercase')
                .startsWith(lowerCaseTerm)
                .and(asset => asset.projectId === projectId);
        }
        
        const results = await collection.toArray();
        return results;
    } catch (error) {
        console.error("Error searching assets in cache: ", error);
        return [];
    }
}

const API_UPLOAD_MEDIA_ENDPOINT = '/api/upload-media';

async function uploadMediaViaApi(
  fileDataUrl: string,
  projectId: string,
  assetId: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(API_UPLOAD_MEDIA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileDataUrl, projectId, assetId }),
    });
    const payload = await response.json();

    if (response.ok && payload?.success && typeof payload.url === 'string') {
      return payload.url;
    }

    console.error('Offline upload via API failed', payload?.error || response.status);
    return null;
  } catch (error) {
    console.error('Failed to upload media using API route:', error);
    return null;
  }
}
