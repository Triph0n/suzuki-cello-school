import { useState, useRef } from "react";
import { Play, FileText, Headphones, Book } from "lucide-react";
import { formatMediaName } from "../mediaConfig";

export default function VideoLibrary({ title, mediaSrcMap }) {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleAudioLoad = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  };

  // mediaSrcMap is an object from import.meta.glob
  const rawFiles = Object.entries(mediaSrcMap).map(([path, url]) => {
    const parts = path.split('/');
    const filename = parts.pop();
    const name = formatMediaName(path);
    const extension = filename.split('.').pop().toLowerCase();
    
    // Detect "Book X" or "Book X Accomp" anywhere in the path
    // e.g. ./mp3/Suzuki mp3 Official/Book 1/01 - ...mp3
    //      ./mp3/Suzuki mp3 Official/Book 1 Accomp/22 - ...mp3
    let folderPath = "Ostatní";
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

  const files = Array.from(uniqueFilesMap.values());

  const renderGrid = (items) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {items.map((file, idx) => (
        <div 
          key={idx} 
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 shadow-sm hover:shadow-lg rounded-3xl p-6 flex items-center gap-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group"
          onClick={() => setSelectedMedia(file)}
        >
          <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 ${
            file.type === 'book' ? "bg-red-100 text-red-600" : 
            file.type === 'audio' ? "bg-amber-100 text-amber-600" : 
            "bg-secondary-container text-tertiary"
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
        </div>
      ))}
      {items.length === 0 && (
        <div className="col-span-full text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 text-center text-lg italic shadow-sm">
          No items available in this category.
        </div>
      )}
    </div>
  );

  const groupFilesByFolder = (fileList) => {
    return fileList.reduce((acc, file) => {
      if (!acc[file.folder]) acc[file.folder] = [];
      acc[file.folder].push(file);
      return acc;
    }, {});
  };

  const books = files.filter(f => f.type === 'book');
  const media = files.filter(f => f.type !== 'book');

  const groupedBooks = groupFilesByFolder(books);
  const groupedMedia = groupFilesByFolder(media);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-10 drop-shadow-sm">
        {title} 
      </h1>

      {selectedMedia ? (
        <div className="fixed inset-0 sm:p-6 md:p-10 lg:p-12 z-[60] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col h-full bg-surface-container-low border border-outline-variant/30 rounded-[2rem] shadow-2xl overflow-hidden p-2 sm:p-4">
            
            <div className="flex justify-between items-center px-2 pb-4 mb-2 border-b border-outline-variant/20 shrink-0 gap-4">
               <h2 className="font-headline text-lg sm:text-xl font-bold text-on-background break-words" title={selectedMedia.name}>{selectedMedia.name}</h2>
               <button 
                 onClick={() => setSelectedMedia(null)}
                 className="flex items-center gap-2 bg-surface-variant hover:bg-surface-container-highest border-none px-4 py-2 rounded-xl text-on-surface-variant hover:text-primary font-bold cursor-pointer transition-colors shadow-sm"
               >
                 Zavřít ✕
               </button>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden">
               {selectedMedia.type === 'book' ? (
                   <iframe src={selectedMedia.url} className="w-full h-full border-none bg-white" title={selectedMedia.name} />
               ) : selectedMedia.type === 'audio' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-surface-container">
                     <div className="p-8 bg-surface-hover rounded-full shadow-inner animate-pulse">
                       <Headphones size={64} className="text-amber-500" />
                     </div>
                     <audio ref={audioRef} onLoadedData={handleAudioLoad} src={selectedMedia.url} controls autoPlay className="w-full max-w-md shadow-md rounded-full" />
                     <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                        <label htmlFor="speed" className="font-bold text-on-surface-variant">Rychlost:</label>
                        <select 
                          id="speed"
                          value={playbackSpeed}
                          onChange={handleSpeedChange}
                          className="bg-surface-variant text-on-surface p-2 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none cursor-pointer font-medium"
                        >
                          <option value="0.5">0.5x</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x (Normální)</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                        </select>
                      </div>
                  </div>
               ) : (
                  <video src={selectedMedia.url} controls autoPlay className="w-full h-full object-contain" />
               )}
            </div>

          </div>
        </div>
      ) : (
        <>
          {Object.keys(groupedBooks).length > 0 && (
            <div className="mb-14">
              <h2 className="font-headline text-3xl font-bold text-on-background mb-8 pb-4 border-b-2 border-outline-variant/30 flex items-center gap-3">
                <Book className="text-tertiary" />
                Knihy a Materiály
              </h2>
              {Object.entries(groupedBooks).sort(sortFolders).map(([folder, fItems]) => (
                <div key={folder} className="mb-8">
                  <h3 className={`font-headline text-xl text-primary font-bold flex items-center gap-2 mb-6 ${folder !== "Ostatní" ? "mt-4" : "mt-0"}`}>
                    <span className="text-2xl">📁</span> {folder}
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
                Videa a Nahrávky
              </h2>
              {Object.entries(groupedMedia).sort(sortFolders).map(([folder, fItems]) => (
                <div key={folder} className="mb-8">
                  <h3 className={`font-headline text-xl text-primary font-bold flex items-center gap-2 mb-6 ${folder !== "Ostatní" ? "mt-4" : "mt-0"}`}>
                    <span className="text-2xl">📁</span> {folder}
                  </h3>
                  {renderGrid(sortFiles(fItems))}
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && (
             <div className="text-center p-12 text-on-surface-variant bg-surface-container-low rounded-3xl border border-outline-variant/30 italic text-lg shadow-sm">
               V této kategorii nejsou zatím dostupné žádné soubory.
             </div>
          )}
        </>
      )}
    </div>
  );
}
