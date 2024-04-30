export type AssessmentCategories = {
  playlists?: string;
  topArtists?: string;
  topTracks?: string;
  savedAlbums?: string;
  recentlyPlayed?: string;
};

export type AssessmentPersonality = {
  personality: string;
  title: string;
};

export type AssessmentMBTI = {
  trait: string;
  explanation: string;
};

export type Assessment = {
  id: string;
  createdAt: string;
  selected: boolean;
  categories: AssessmentCategories;
  personality: AssessmentPersonality["personality"];
  title: AssessmentPersonality["title"];
  mbtiTraits: AssessmentMBTI[];
};

export type StreamEvent<T> =
  | {
      type: "progress" | "error";
      message: string;
    }
  | {
      type: "result";
      result: T;
    };
