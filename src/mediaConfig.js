import manifest from './mediaManifest.json';

const isLocalRuntime =
  import.meta.env.DEV ||
  (typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname));

// Local PC runs should play the bundled files directly from disk via Vite.
// Cloudflare Pages keeps using the Pages Function endpoint backed by R2.
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || (isLocalRuntime ? "/src" : "/api/media");
const MEDIA_STORAGE_MODE = import.meta.env.VITE_MEDIA_STORAGE_MODE || (isLocalRuntime ? "local" : "r2");

// R2 bucket uses 'Video/' (capital V) but manifest has lowercase 'video/'
// This map corrects the casing for each top-level folder
const R2_FOLDER_MAP = {
  'video': 'Video',
};

function mapToR2(fileObj) {
  const mapped = {};
  for (const [key, val] of Object.entries(fileObj)) {
    // val is like "./video/Suzuki Pre-Twilnkle/file.mp4"
    const cleanPath = val.replace(/^\.\//, ''); // remove leading ./
    const parts = cleanPath.split('/');
    // Correct top-level folder casing to match R2 bucket keys
    if (MEDIA_STORAGE_MODE === "r2" && parts[0] && R2_FOLDER_MAP[parts[0]]) {
      parts[0] = R2_FOLDER_MAP[parts[0]];
    }
    // Encode each segment to handle spaces and special characters
    const encodedParts = parts.map((part) => {
      const encoded = encodeURIComponent(part);
      return MEDIA_STORAGE_MODE === "local" ? encoded.replace(/%2B/gi, "+") : encoded;
    });
    mapped[key] = MEDIA_BASE_URL + '/' + encodedParts.join('/');
  }
  return mapped;
}

export const combinedPreTwinkleFiles = mapToR2({ ...manifest.preTwinkleFiles, ...manifest.preTwinkleMp3Files });
export const allCheckpointsFiles = mapToR2(manifest.checkpointsFiles);
export const allJoggersFiles = mapToR2(manifest.joggersFiles);
export const allBooksFiles = mapToR2(manifest.booksLibraryFiles);
export const allSuzukiMp3OfficialFiles = mapToR2(manifest.suzukiMp3OfficialFiles);

export const allMediaFiles = {
  ...combinedPreTwinkleFiles,
  ...allCheckpointsFiles,
  ...allJoggersFiles,
  ...allBooksFiles,
  ...allSuzukiMp3OfficialFiles
};

// Helper to format filenames for clean UI display
export function formatMediaName(path) {
  const parts = path.split('/');
  const filenameWithQuery = parts.pop();
  const filename = filenameWithQuery.split('?')[0];
  let name = filename.replace(/\.(mp4|m4v|pdf|avi|mov|mp3|wav)$/i, '');
  try {
    name = decodeURIComponent(name);
  } catch {
    // Ignore decoding errors
  }
  name = name.replace(/^Exercise\s+(No\.?\s*)?/i, '');
  name = name.replace(/\s*Cello Time Joggers.*/i, '');
  return name.trim();
}
