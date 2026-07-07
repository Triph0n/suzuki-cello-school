import { useMemo, useState } from "react";
import { Play, FileText, Headphones, Book, Folder, Library } from "lucide-react";
import { MEDIA_CATEGORIES, formatMediaName } from "../mediaConfig";
import MediaOverlay from "../components/MediaOverlay";
import EmptyState from "../components/ui/EmptyState";

// Helper: sort folders naturally — Book 1 < Book 2 < Book 1 Accomp < Book 2 Accomp
const sortFolders = ([a], [b]) => {
  const bookNum = (s) => { const m = s.match(/Book\s+(\d+)/i); return m ? parseInt(m[1], 10) : 999; };
  const isAccomp = (s) => /Accomp/i.test(s);
  const na = bookNum(a), nb = bookNum(b);
  if (na !== nb) return na - nb;
  if (isAccomp(a) !== isAccomp(b)) return isAccomp(a) ? 1 : -1;
  return a.localeCompare(b, undefined, { numeric: true });
};

// Helper: sort files by leading track number, then alphabetically
const sortFiles = (arr) => [...arr].sort((a, b) => {
  const num = (n) => { const m = n.match(/^(\d+)/); return m ? parseInt(m[1], 10) : 9999; };
  const na = num(a.name), nb = num(b.name);
  if (na !== nb) return na - nb;
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
});

const groupFilesByFolder = (fileList) => {
  return fileList.reduce((acc, file) => {
    if (!acc[file.folder]) acc[file.folder] = [];
    acc[file.folder].push(file);
    return acc;
  }, {});
};

export default function VideoLibrary({ title, category }) {
  const [selectedMedia, setSelectedMedia] = useState(null);

  // The Suzuki mp3 category alone has hundreds of entries, so the whole
  // map → dedup → group pass is memoized instead of re-running per render.
  const { files, groupedBooks, groupedMedia } = useMemo(() => {
    const mediaSrcMap = MEDIA_CATEGORIES[category] || {};
    const rawFiles = Object.entries(mediaSrcMap).map(([path, url]) => {
      const parts = path.split('/');
      const filename = parts.pop();
      const name = formatMediaName(path);
      const extension = filename.split('.').pop().toLowerCase();

      // Detect "Book X" or "Book X Accomp" anywhere in the path
      // e.g. ./mp3/Suzuki mp3 Official/Book 1/01 - ...mp3
      //      ./mp3/Suzuki mp3 Official/Book 1 Accomp/22 - ...mp3
      let folderPath = "Other";
      const bookMatch = path.match(/\/(Book\s+\d+(?:\s+Accomp)?)\//i);
      if (bookMatch) {
        folderPath = bookMatch[1]; // e.g. "Book 1" or "Book 1 Accomp"
      } else if (parts.length > 2) {
        // fallback: use the deepest subfolder name
        folderPath = parts.slice(2).join(' / ');
      }

      let type = 'video';
      if (extension === 'pdf') {
        type = 'book';
      } else if (['mp3', 'wav'].includes(extension)) {
        type = 'audio';
      }

      return { name, url, type, folder: folderPath };
    });

    // Dedup by folder+name so same-title tracks in different books are not collapsed
    const uniqueFilesMap = new Map();
    for (const file of rawFiles) {
      const key = `${file.folder}||${file.name}`;
      if (!uniqueFilesMap.has(key)) {
        uniqueFilesMap.set(key, file);
      }
    }

    const files = Array.from(uniqueFilesMap.values());
    return {
      files,
      groupedBooks: groupFilesByFolder(files.filter(f => f.type === 'book')),
      groupedMedia: groupFilesByFolder(files.filter(f => f.type !== 'book')),
    };
  }, [category]);

  const renderGrid = (items) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {items.map((file) => (
        <button
          key={`${file.folder}||${file.name}`}
          type="button"
          className={`text-left bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 border-l-4 shadow-sm hover:shadow-lg rounded-3xl p-6 flex items-center gap-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group ${
            file.type === 'book' ? "border-l-madder" :
            file.type === 'audio' ? "border-l-rosin" :
            "border-l-lake"
          }`}
          onClick={() => setSelectedMedia(file)}
        >
          <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
            file.type === 'book' ? "bg-madder-wash text-madder" :
            file.type === 'audio' ? "bg-rosin-wash text-rosin" :
            "bg-lake-wash text-lake"
          }`}>
            {file.type === 'book' ? <FileText size={28} /> : file.type === 'audio' ? <Headphones size={28} /> : <Play size={28} className="ml-1" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline text-sm leading-snug font-bold text-on-background mb-1 group-hover:text-primary transition-colors" title={file.name}>
              {file.name}
            </h3>
            <span className="text-sm text-on-surface-variant font-medium tracking-wide uppercase">
              {file.type}
            </span>
          </div>
        </button>
      ))}
      {items.length === 0 && (
        <EmptyState
          icon={Library}
          title="No items available in this category"
          className="col-span-full"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-10">
        {title}
      </h1>

      {selectedMedia && (
        <MediaOverlay
          title={selectedMedia.name}
          url={selectedMedia.url}
          type={selectedMedia.type}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {Object.keys(groupedBooks).length > 0 && (
        <div className="mb-14">
          <h2 className="font-headline text-3xl font-bold text-on-background mb-8 pb-4 border-b-2 border-outline-variant/30 flex items-center gap-3">
            <Book className="text-tertiary" />
            Books & Materials
          </h2>
          {Object.entries(groupedBooks).sort(sortFolders).map(([folder, fItems]) => (
            <div key={folder} className="mb-8">
              <h3 className={`font-headline text-xl text-primary font-bold flex items-center gap-2 mb-6 ${folder !== "Other" ? "mt-4" : "mt-0"}`}>
                <Folder size={20} className="text-tertiary" /> {folder}
              </h3>
              {renderGrid(sortFiles(fItems))}
            </div>
          ))}
        </div>
      )}

      {Object.keys(groupedMedia).length > 0 && (
        <div className="mb-14">
          <h2 className="font-headline text-3xl font-bold text-on-background mb-8 pb-4 border-b-2 border-outline-variant/30 flex items-center gap-3">
            <Play className="text-tertiary" />
            Videos & Recordings
          </h2>
          {Object.entries(groupedMedia).sort(sortFolders).map(([folder, fItems]) => (
            <div key={folder} className="mb-8">
              <h3 className={`font-headline text-xl text-primary font-bold flex items-center gap-2 mb-6 ${folder !== "Other" ? "mt-4" : "mt-0"}`}>
                <Folder size={20} className="text-tertiary" /> {folder}
              </h3>
              {renderGrid(sortFiles(fItems))}
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <EmptyState
          icon={Library}
          title="No files are available in this category yet"
        />
      )}
    </div>
  );
}
