const preTwinkleFiles = import.meta.glob('./video/Suzuki Pre-Twilnkle/*.*', { eager: true, query: '?url', import: 'default' });
const preTwinkleMp3Files = import.meta.glob('./mp3/Twinkle assembly Cello Tracks/*.*', { eager: true, query: '?url', import: 'default' });
const checkpointsFiles = import.meta.glob('./video/Cello Technique Checkpoints/*.*', { eager: true, query: '?url', import: 'default' });
const joggersFiles = import.meta.glob('./video/Cello Time Joggers Video/*.*', { eager: true, query: '?url', import: 'default' });
const booksLibraryFiles = import.meta.glob('./books/**/*.pdf', { eager: true, query: '?url', import: 'default' });
const suzukiMp3OfficialFiles = import.meta.glob('./mp3/Suzuki mp3 Official/**/*.*', { eager: true, query: '?url', import: 'default' });

export const combinedPreTwinkleFiles = { ...preTwinkleFiles, ...preTwinkleMp3Files };
export const allCheckpointsFiles = checkpointsFiles;
export const allJoggersFiles = joggersFiles;
export const allBooksFiles = booksLibraryFiles;
export const allSuzukiMp3OfficialFiles = suzukiMp3OfficialFiles;

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
  const filename = parts.pop();
  let name = filename.replace(/\.(mp4|m4v|pdf|avi|mov|mp3|wav)$/i, '');
  name = name.replace(/^Exercise\s+(No\.?\s*)?/i, '');
  name = name.replace(/\s*Cello Time Joggers.*/i, '');
  return name.trim();
}
