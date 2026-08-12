export const STORAGE_KEY = "viewtube-prop-settings-v2";
const LEGACY_STORAGE_KEY = "viewtube-prop-settings-v1";
const LEGACY_DEFAULT_HASHTAGS = "#발표꿀팁 #학교생활 #중학생 #혜민의교실생활";
const DEFAULT_HASHTAGS = "#발표꿀팁 #학교생활 #초등학생 #혜민의교실생활";
export const VIDEO_DURATION_SECONDS = 136;

export type PropComment = {
  id: string;
  author: string;
  text: string;
  triggerCount: number;
  delaySeconds: number;
};

export type UserReaction = "none" | "like" | "dislike";

export type PropSettings = {
  videoTitle: string;
  hashtags: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: UserReaction;
  thumbnailUrl: string;
  pausedAtSeconds: number;
  showPlayButton: boolean;
  startCount: number;
  viewCount: number;
  showFakeStatusBar: boolean;
  fakeTime: string;
  battery: number;
  comments: PropComment[];
};

export const DEFAULT_SETTINGS: PropSettings = {
  videoTitle: "발표할 때 심장 안 떨리는 꿀팁!",
  hashtags: DEFAULT_HASHTAGS,
  likeCount: 12,
  dislikeCount: 0,
  userReaction: "none",
  thumbnailUrl: "",
  pausedAtSeconds: 3,
  showPlayButton: false,
  startCount: 97,
  viewCount: 97,
  showFakeStatusBar: false,
  fakeTime: "9:36",
  battery: 20,
  comments: [
    {
      id: "library-comment",
      author: "@교실밖관찰자",
      text: "좀 지루해요. 웃기려고 만든 거 맞음?",
      triggerCount: 45,
      delaySeconds: 0,
    },
    {
      id: "hundred-comment",
      author: "@솔직한사람",
      text: "솔직히 재미없어요...",
      triggerCount: 100,
      delaySeconds: 0,
    },
    {
      id: "delayed-comment",
      author: "@웃긴거좋아",
      text: "하나도 안 웃김..ㅋㅋㅋㅋ",
      triggerCount: 100,
      delaySeconds: 3,
    },
  ],
};

function normalizeComment(comment: Partial<PropComment>, index: number): PropComment {
  return {
    id: typeof comment.id === "string" && comment.id ? comment.id : `comment-${index}`,
    author: typeof comment.author === "string" ? comment.author : "@시청자",
    text: typeof comment.text === "string" ? comment.text : "",
    triggerCount: Number.isFinite(comment.triggerCount) ? Math.max(0, Number(comment.triggerCount)) : 0,
    delaySeconds: Number.isFinite(comment.delaySeconds) ? Math.max(0, Number(comment.delaySeconds)) : 0,
  };
}

function normalizeSettings(stored: Partial<PropSettings>): PropSettings {
  return {
    videoTitle: typeof stored.videoTitle === "string" && stored.videoTitle.trim()
      ? stored.videoTitle
      : DEFAULT_SETTINGS.videoTitle,
    // 사용자가 수정하지 않은 과거 기본 해시태그만 새 학교급 표기로 전환한다.
    hashtags: stored.hashtags === LEGACY_DEFAULT_HASHTAGS
      ? DEFAULT_HASHTAGS
      : typeof stored.hashtags === "string" ? stored.hashtags : DEFAULT_SETTINGS.hashtags,
    likeCount: Number.isFinite(stored.likeCount)
      ? Math.max(0, Math.floor(Number(stored.likeCount)))
      : DEFAULT_SETTINGS.likeCount,
    dislikeCount: Number.isFinite(stored.dislikeCount)
      ? Math.max(0, Math.floor(Number(stored.dislikeCount)))
      : DEFAULT_SETTINGS.dislikeCount,
    userReaction: stored.userReaction === "like" || stored.userReaction === "dislike"
      ? stored.userReaction
      : "none",
    thumbnailUrl: typeof stored.thumbnailUrl === "string" ? stored.thumbnailUrl : DEFAULT_SETTINGS.thumbnailUrl,
    pausedAtSeconds: Number.isFinite(stored.pausedAtSeconds)
      ? Math.min(VIDEO_DURATION_SECONDS, Math.max(0, Number(stored.pausedAtSeconds)))
      : DEFAULT_SETTINGS.pausedAtSeconds,
    showPlayButton: Boolean(stored.showPlayButton),
    startCount: Number.isFinite(stored.startCount) ? Math.max(0, Number(stored.startCount)) : DEFAULT_SETTINGS.startCount,
    viewCount: Number.isFinite(stored.viewCount) ? Math.max(0, Number(stored.viewCount)) : DEFAULT_SETTINGS.viewCount,
    showFakeStatusBar: Boolean(stored.showFakeStatusBar),
    fakeTime: typeof stored.fakeTime === "string" ? stored.fakeTime : DEFAULT_SETTINGS.fakeTime,
    battery: Number.isFinite(stored.battery)
      ? Math.min(100, Math.max(0, Number(stored.battery)))
      : DEFAULT_SETTINGS.battery,
    comments: Array.isArray(stored.comments) && stored.comments.length > 0
      ? stored.comments.map(normalizeComment)
      : DEFAULT_SETTINGS.comments,
  };
}

export function readStoredSettings(): PropSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const stored = JSON.parse(raw ?? legacyRaw ?? "{}") as Partial<PropSettings>;
    return normalizeSettings(stored);
  } catch {
    // 손상된 저장값은 촬영 기본 설정으로 안전하게 복구한다.
    return DEFAULT_SETTINGS;
  }
}

export const SCENES_STORAGE_KEY = "viewtube-prop-scenes-v1";

export type SavedScene = {
  id: string;
  name: string;
  savedAt: number;
  settings: PropSettings;
};

export function readSavedScenes(): SavedScene[] {
  try {
    const raw = window.localStorage.getItem(SCENES_STORAGE_KEY);
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: Partial<SavedScene>, index) => ({
      id: typeof item?.id === "string" && item.id ? item.id : `scene-${index}`,
      name: typeof item?.name === "string" && item.name.trim() ? item.name : `장면 ${index + 1}`,
      savedAt: Number.isFinite(item?.savedAt) ? Number(item?.savedAt) : Date.now(),
      settings: normalizeSettings(item?.settings ?? {}),
    }));
  } catch {
    return [];
  }
}

export function saveSavedScenes(scenes: SavedScene[]) {
  try {
    window.localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(scenes));
  } catch {
    // 사생활 보호 모드 등 저장이 막힌 환경에서도 현재 화면은 계속 사용한다.
  }
}

export function saveStoredSettings(settings: PropSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 사생활 보호 모드 등 저장이 막힌 환경에서도 현재 화면은 계속 사용한다.
  }
}

export function parseHashtags(hashtags: string): string[] {
  return hashtags
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

const THUMBNAIL_MAX_DIMENSION = 960;

export function resizeImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const reader = new FileReader();
    reader.onerror = () => rejectPromise(new Error("파일을 읽지 못했습니다."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => rejectPromise(new Error("이미지를 불러오지 못했습니다."));
      image.onload = () => {
        const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          rejectPromise(new Error("이미지를 처리할 수 없습니다."));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolvePromise(canvas.toDataURL("image/jpeg", 0.85));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatVideoTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
