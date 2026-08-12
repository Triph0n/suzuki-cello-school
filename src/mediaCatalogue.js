import {
  combinedPreTwinkleFiles,
  allCheckpointsFiles,
  allJoggersFiles,
  allBooksFiles,
  allSuzukiMp3OfficialFiles,
  formatMediaName
} from "./mediaConfig";

// The library the teacher picks from, in one place: both "assign to a student"
// and "add to my materials" read it, so neither screen ever asks for a title to
// be typed or a kind to be chosen. The kind comes from the file extension —
// nobody should have to tell the app that an .mp3 is audio.
const kindOf = (path) => {
  const extension = path.split(".").pop().toLowerCase();
  if (extension === "pdf") return "book";
  if (["mp3", "wav"].includes(extension)) return "audio";
  return "video";
};

const filesFrom = (globMap, categoryLabel) =>
  Object.keys(globMap)
    .map((path) => {
      const parts = path.split("/");
      return {
        videoId: path, // the path is the id
        title: formatMediaName(path),
        category: categoryLabel,
        type: kindOf(path),
        folder: parts.length > 2 ? parts.slice(2, -1).join(" / ") : ""
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

export const MEDIA_TABS = [
  { id: "pretwinkle", label: "Pre-Twinkle", files: filesFrom(combinedPreTwinkleFiles, "pretwinkle") },
  { id: "checkpoints", label: "Checkpoints", files: filesFrom(allCheckpointsFiles, "checkpoints") },
  { id: "joggers", label: "Time Joggers", files: filesFrom(allJoggersFiles, "timejoggers") },
  { id: "suzukimp3", label: "Suzuki mp3", files: filesFrom(allSuzukiMp3OfficialFiles, "suzukimp3") },
  { id: "books", label: "Books", files: filesFrom(allBooksFiles, "book") }
];

// Human label for the kind, for places that show it as text.
export const KIND_LABEL = { video: "Video", audio: "Audio", book: "PDF" };
