export const STORAGE_KEY = "viewtube-prop-settings-v2";
const LEGACY_STORAGE_KEY = "viewtube-prop-settings-v1";
export const VIDEO_DURATION_SECONDS = 136;

export type PropComment = {
  id: string;
  author: string;
  text: string;
  triggerCount: number;
  delaySeconds: number;
};

export type PropSettings = {
  videoTitle: string;
  hashtags: string;
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
  hashtags: "#발표꿀팁 #학교생활 #중학생 #혜민의교실생활",
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

export function readStoredSettings(): PropSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const stored = JSON.parse(raw ?? legacyRaw ?? "{}") as Partial<PropSettings>;

    return {
      videoTitle: typeof stored.videoTitle === "string" && stored.videoTitle.trim()
        ? stored.videoTitle
        : DEFAULT_SETTINGS.videoTitle,
      hashtags: typeof stored.hashtags === "string" ? stored.hashtags : DEFAULT_SETTINGS.hashtags,
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
  } catch {
    // 손상된 저장값은 촬영 기본 설정으로 안전하게 복구한다.
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: PropSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 사생활 보호 모드 등 저장이 막힌 환경에서도 현재 화면은 계속 사용한다.
  }
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
