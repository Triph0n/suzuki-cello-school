// Feature switches for parts of the app that are built but not shown yet.
// Nothing here is deleted: flip a flag back to true and the feature returns
// with its data intact, because the engine keeps maintaining it either way.
export const FEATURES = {
  // Ensemble Hall: the ladder of groups that play together (chairs, rehearsals,
  // premiere). Hidden from the student screen for now — the chairs can only be
  // filled by the teacher, so a child practising alone sees a section that
  // never moves. The engine keeps recording rehearsals, so turning this back
  // on loses no progress.
  ensembleHall: false,

  // The collection screens: the shelf, the bands, instrument equipping, and the
  // card that names what today is being played for. Off on purpose — the
  // child's screen is one button, the pearls, and the video the teacher set.
  // Cards still arrive and are still collected; there is simply nowhere to go
  // browsing. Turn this on if practice stalls and the collection needs to pull.
  collectionScreen: false,

  // The whole reward loop: Cellino, the practice timer, pearls, chests and the
  // teacher's goal/awarding panels. Off for the simple version — the app is
  // just the assigned videos and audio plus the tuner and metronome. The
  // engine and its localStorage state stay intact; flip this back to true and
  // everything returns with its data.
  gamification: false
};
