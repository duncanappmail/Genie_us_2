import type { Project, UploadedFile, BrandProfile } from '../types';

const DB_NAME = 'GenieUsDB';
const DB_VERSION = 2; // Increment version for schema change
const PROJECTS_STORE_NAME = 'projects';
const FILES_STORE_NAME = 'files';
const BRAND_PROFILES_STORE_NAME = 'brandProfiles';

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening database');
        };
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
                db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(FILES_STORE_NAME)) {
                db.createObjectStore(FILES_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(BRAND_PROFILES_STORE_NAME)) {
                db.createObjectStore(BRAND_PROFILES_STORE_NAME, { keyPath: 'userId' });
            }
        };
    });
};

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const getLeanProjectForStorage = (project: Project): Project => {
    const leanProject = JSON.parse(JSON.stringify(project));
    
    const stripFileData = (file: UploadedFile | null): UploadedFile | null => {
        if (!file) return null;
        const { blob, base64, ...rest } = file;
        return rest as UploadedFile;
    };

    leanProject.productFile = stripFileData(leanProject.productFile);
    leanProject.generatedImages = leanProject.generatedImages.map(stripFileData);
    leanProject.generatedVideos = leanProject.generatedVideos.map(stripFileData);
    leanProject.referenceFiles = leanProject.referenceFiles.map(stripFileData);
    if (leanProject.startFrame) leanProject.startFrame = stripFileData(leanProject.startFrame);
    if (leanProject.endFrame) leanProject.endFrame = stripFileData(leanProject.endFrame);

    return leanProject;
};

const rehydrateProject = async (leanProject: Project, filesStore: IDBObjectStore): Promise<Project> => {
    const project = JSON.parse(JSON.stringify(leanProject));

    const rehydrateFile = async (file: UploadedFile | null): Promise<UploadedFile | null> => {
        if (!file) return null;
        try {
            const fileRecord = await promisifyRequest<{ id: string, blob: Blob }>(filesStore.get(file.id));
            if (fileRecord) {
                return { ...file, blob: fileRecord.blob };
            }
        } catch (e) {
            console.error(`Failed to rehydrate file ${file.id}`, e);
        }
        return file;
    };
    
    project.productFile = await rehydrateFile(project.productFile);
    project.generatedImages = await Promise.all(project.generatedImages.map(rehydrateFile));
    project.generatedVideos = await Promise.all(project.generatedVideos.map(rehydrateFile));
    project.referenceFiles = await Promise.all(project.referenceFiles.map(rehydrateFile));
    if (project.startFrame) project.startFrame = await rehydrateFile(project.startFrame);
    if (project.endFrame) project.endFrame = await rehydrateFile(project.endFrame);

    return project;
};

export const saveProject = async (project: Project): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const projectsStore = tx.objectStore(PROJECTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const filesToStore: UploadedFile[] = [
        project.productFile,
        ...project.generatedImages,
        ...project.generatedVideos,
        ...project.referenceFiles,
        project.startFrame,
        project.endFrame,
    ].filter((f): f is UploadedFile => !!f && !!f.blob);

    await Promise.all(filesToStore.map(file => 
        promisifyRequest(filesStore.put({ id: file.id, blob: file.blob }))
    ));

    const leanProject = getLeanProjectForStorage(project);
    await promisifyRequest(projectsStore.put(leanProject));

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE_NAME, FILES_STORE_NAME], 'readonly');
    const projectsStore = tx.objectStore(PROJECTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const allLeanProjects: Project[] = await promisifyRequest(projectsStore.getAll());
    const userProjects = allLeanProjects.filter(p => p.userId === userId);
    
    const hydratedProjects = await Promise.all(
        userProjects.map(p => rehydrateProject(p, filesStore))
    );

    return hydratedProjects.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const projectsStore = tx.objectStore(PROJECTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProject: Project = await promisifyRequest(projectsStore.get(projectId));
    if (leanProject) {
        const fileIds = [
            leanProject.productFile,
            ...leanProject.generatedImages,
            ...leanProject.generatedVideos,
            ...leanProject.referenceFiles,
            leanProject.startFrame,
            leanProject.endFrame,
        ].filter(Boolean).map(f => f!.id);

        await Promise.all(fileIds.map(id => promisifyRequest(filesStore.delete(id))));
    }

    await promisifyRequest(projectsStore.delete(projectId));
    
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// --- Brand Profile Functions ---

export const saveBrandProfile = async (profile: BrandProfile): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([BRAND_PROFILES_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const profilesStore = tx.objectStore(BRAND_PROFILES_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);
    
    const { logoFile, ...leanProfile } = profile;
    
    if (logoFile && logoFile.blob) {
        await promisifyRequest(filesStore.put({ id: logoFile.id, blob: logoFile.blob }));
    }
    
    const profileToStore = {
        ...leanProfile,
        logoFile: logoFile ? { id: logoFile.id, mimeType: logoFile.mimeType, name: logoFile.name } : null
    };

    await promisifyRequest(profilesStore.put(profileToStore));
};

export const getBrandProfile = async (userId: string): Promise<BrandProfile | null> => {
    const db = await getDB();
    const tx = db.transaction([BRAND_PROFILES_STORE_NAME, FILES_STORE_NAME], 'readonly');
    const profilesStore = tx.objectStore(BRAND_PROFILES_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProfile = await promisifyRequest<any>(profilesStore.get(userId));
    if (!leanProfile) return null;

    if (leanProfile.logoFile) {
        try {
            const fileRecord = await promisifyRequest<{ id: string, blob: Blob }>(filesStore.get(leanProfile.logoFile.id));
            if (fileRecord) {
                leanProfile.logoFile.blob = fileRecord.blob;
            }
        } catch (e) {
            console.error(`Failed to rehydrate logo file ${leanProfile.logoFile.id}`, e);
        }
    }
    
    return leanProfile as BrandProfile;
};

export const deleteBrandProfile = async (userId: string): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([BRAND_PROFILES_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const profilesStore = tx.objectStore(BRAND_PROFILES_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProfile = await promisifyRequest<any>(profilesStore.get(userId));

    if (leanProfile && leanProfile.logoFile) {
        try {
            await promisifyRequest(filesStore.delete(leanProfile.logoFile.id));
        } catch (e) {
            console.error(`Failed to delete logo file ${leanProfile.logoFile.id}`, e);
        }
    }
    
    await promisifyRequest(profilesStore.delete(userId));
};