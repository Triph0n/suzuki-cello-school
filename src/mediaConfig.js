import manifest from './mediaManifest.json';

// We now use the Cloudflare Pages Function endpoint instead of the direct R2 URL
const R2_BASE_URL = "/api/media";

function mapToR2(fileObj) {
  const mapped = {};
  for (const [key, val] of Object.entries(fileObj)) {
    // val is like "./video/Suzuki Pre-Twilnkle/file.mp4"
    // we want to convert it to R2_BASE_URL + "/video/Suzuki Pre-Twilnkle/file.mp4"
    const cleanPath = val.replace(/^\.\//, '/'); 
    // Encode the URI to handle spaces and special characters, except for the slashes
    const parts = cleanPath.split('/');
    const encodedParts = parts.map(part => encodeURIComponent(part));
    mapped[key] = R2_BASE_URL + encodedParts.join('/');
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
  } catch (e) {
    // Ignore decoding errors
  }
  name = name.replace(/^Exercise\s+(No\.?\s*)?/i, '');
  name = name.replace(/\s*Cello Time Joggers.*/i, '');
  return name.trim();
}
