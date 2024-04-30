export type AssessmentCategories = {
  playlists?: string;
  topArtists?: string;
  topTracks?: string;
  savedAlbums?: string;
  recentlyPlayed?: string;
};

export type AssessmentPersonality = {
  personality: string;
};

export type AssessmentMBTI = {
  trait: string;
  explanation: string;
};

export type AssessmentContent = {
  categories: AssessmentCategories;
  personality: AssessmentPersonality["personality"];
  mbtiTraits: AssessmentMBTI[];
};

export type Assessment = AssessmentContent & {
  id: string;
  createdAt: string;
  selected: boolean;
};
