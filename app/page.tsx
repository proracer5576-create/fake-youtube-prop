"use client";

import Link from "next/link";
import {
  BatteryMedium,
  Bell,
  ChevronDown,
  ChevronUp,
  Expand,
  Home,
  MessageCircle,
  MoreVertical,
  Play,
  Plus,
  Search,
  Share2,
  Signal,
  ThumbsDown,
  ThumbsUp,
  Wifi,
  X,
} from "lucide-react";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  formatCount,
  formatVideoTime,
  parseHashtags,
  PropSettings,
  readStoredSettings,
  saveStoredSettings,
  VIDEO_DURATION_SECONDS,
} from "./lib/prop-settings";

const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function FakeStatusBar({ time, battery }: { time: string; battery: number }) {
  return (
    <div className="fake-status-bar" aria-label={`가짜 상태 표시줄, ${time}, 배터리 ${battery}%`}>
      <strong>{time}</strong>
      <div className="status-icons" aria-hidden="true">
        <Signal size={16} strokeWidth={2.7} />
        <Wifi size={17} strokeWidth={2.7} />
        <BatteryMedium size={20} strokeWidth={2.4} />
        <span>{battery}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [settings, setSettings] = useState<PropSettings>(DEFAULT_SETTINGS);
  const [visibleCommentIds, setVisibleCommentIds] = useState<Set<string>>(new Set());
  const visibleCommentIdsRef = useRef<Set<string>>(new Set());
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const commentTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setSettings(readStoredSettings());
    setReady(true);
  }, []);

  useEffect(() => {
    const activeIds = new Set(settings.comments.map((comment) => comment.id));

    // 조회수 기준 아래로 초기화된 댓글과 삭제된 댓글은 다시 숨긴다.
    setVisibleCommentIds((current) => {
      const next = new Set(
        [...current].filter((id) => {
          const comment = settings.comments.find((item) => item.id === id);
          return comment && activeIds.has(id) && settings.viewCount >= comment.triggerCount;
        }),
      );
      settings.comments
        .filter((comment) => settings.viewCount >= comment.triggerCount && comment.delaySeconds === 0)
        .forEach((comment) => next.add(comment.id));
      visibleCommentIdsRef.current = next;
      if (current.size === next.size && [...current].every((id) => next.has(id))) return current;
      return next;
    });

    for (const [id, timer] of commentTimers.current) {
      const comment = settings.comments.find((item) => item.id === id);
      if (!comment || settings.viewCount < comment.triggerCount || comment.delaySeconds === 0) {
        clearTimeout(timer);
        commentTimers.current.delete(id);
      }
    }

    settings.comments
      .filter((comment) => settings.viewCount >= comment.triggerCount && comment.delaySeconds > 0)
      .forEach((comment) => {
        if (visibleCommentIdsRef.current.has(comment.id) || commentTimers.current.has(comment.id)) return;
        const timer = setTimeout(() => {
          setVisibleCommentIds((current) => {
            const next = new Set(current).add(comment.id);
            visibleCommentIdsRef.current = next;
            return next;
          });
          commentTimers.current.delete(comment.id);
        }, comment.delaySeconds * 1000);
        commentTimers.current.set(comment.id, timer);
      });
  }, [settings.comments, settings.viewCount]);

  useEffect(() => () => {
    commentTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const visibleComments = useMemo(
    () => settings.comments.filter((comment) => visibleCommentIds.has(comment.id)),
    [settings.comments, visibleCommentIds],
  );
  const progressPercent = Math.min(100, Math.max(0, (settings.pausedAtSeconds / VIDEO_DURATION_SECONDS) * 100));
  const displayLikeCount = settings.likeCount + (settings.userReaction === "like" ? 1 : 0);
  const displayDislikeCount = settings.dislikeCount + (settings.userReaction === "dislike" ? 1 : 0);

  const increaseViewCount = useCallback(() => {
    setSettings((current) => {
      const next = { ...current, viewCount: current.viewCount + 1 };
      saveStoredSettings(next);
      return next;
    });
  }, []);

  const toggleReaction = useCallback((kind: "like" | "dislike") => {
    setSettings((current) => {
      const next: PropSettings = {
        ...current,
        userReaction: current.userReaction === kind ? "none" : kind,
      };
      saveStoredSettings(next);
      return next;
    });
  }, []);

  const resetToSettings = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSettings((current) => {
      const next: PropSettings = { ...current, viewCount: current.startCount, userReaction: "none" };
      saveStoredSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, button, textarea, select, a")) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        increaseViewCount();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [increaseViewCount]);

  const handleSurfaceClick = (event: MouseEvent<HTMLElement>) => {
    if (!ready) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-count]")) return;
    increaseViewCount();
  };

  return (
    <main className="page-shell">
      <section
        className="phone-app"
        onClick={handleSurfaceClick}
        aria-label="촬영용 동영상 화면. 빈 곳을 누르면 조회수가 1 증가합니다."
      >
        {settings.showFakeStatusBar && <FakeStatusBar time={settings.fakeTime} battery={settings.battery} />}

        <header className="app-header" data-no-count>
          <div className="brand" aria-label="ViewTube 홈">
            <span className="brand-mark"><Play size={15} fill="currentColor" /></span>
            <span>ViewTube</span>
          </div>
          <div className="header-actions">
            <button type="button" aria-label="검색"><Search /></button>
            <button type="button" aria-label="알림"><Bell /></button>
            <button type="button" className="avatar" aria-label="프로필">혜</button>
          </div>
        </header>

        <div className="video-stage" aria-label="일시정지된 영상, 1분 28초">
          <img
            src={settings.thumbnailUrl || `${PUBLIC_BASE_PATH}/movie-thumbnail.webp`}
            alt="교실에서 세 학생이 발표할 때 긴장하지 않는 팁을 소개하는 영상 썸네일"
            draggable="false"
          />
          <div className="video-shade" />
          {settings.showPlayButton && (
            <span className="pause-play" aria-hidden="true"><Play size={38} fill="white" /></span>
          )}
          <span className="video-time">
            {formatVideoTime(settings.pausedAtSeconds)} / {formatVideoTime(VIDEO_DURATION_SECONDS)}
          </span>
          <div className="progress-track" aria-label={`영상 재생 진행률 ${Math.round(progressPercent)}%`}>
            <div className="progress-value" style={{ width: `${progressPercent}%` }} />
            <span className="progress-thumb" style={{ left: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="video-content">
          <div className="title-row">
            <h1>{settings.videoTitle}</h1>
            <div className="title-actions" data-no-count>
              <button type="button" onClick={() => setDescriptionOpen(true)} aria-label="동영상 설명 열기"><ChevronDown /></button>
              <button type="button" aria-label="동영상 메뉴"><MoreVertical /></button>
            </div>
          </div>
          <p className="metadata" aria-live="polite">
            조회수 <strong key={settings.viewCount} className="count-pop">{formatCount(settings.viewCount)}회</strong>
            {settings.uploadDateText.trim() && (
              <><span>·</span> {settings.uploadDateText.trim()}</>
            )}
          </p>

          {parseHashtags(settings.hashtags).length > 0 && (
            <p className="hashtag-line" aria-label="동영상 해시태그">
              {parseHashtags(settings.hashtags).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </p>
          )}

          <div className="action-rail" data-no-count>
            <button
              type="button"
              className={settings.userReaction === "like" ? "active" : ""}
              aria-pressed={settings.userReaction === "like"}
              aria-label={`좋아요 ${formatCount(displayLikeCount)}개`}
              onClick={() => toggleReaction("like")}
            >
              <ThumbsUp fill={settings.userReaction === "like" ? "currentColor" : "none"} />
              <strong>{formatCount(displayLikeCount)}</strong>
            </button>
            <button
              type="button"
              className={settings.userReaction === "dislike" ? "active" : ""}
              aria-pressed={settings.userReaction === "dislike"}
              aria-label={`싫어요 ${formatCount(displayDislikeCount)}개`}
              onClick={() => toggleReaction("dislike")}
            >
              <ThumbsDown fill={settings.userReaction === "dislike" ? "currentColor" : "none"} />
              <strong>{formatCount(displayDislikeCount)}</strong>
            </button>
            <button type="button" aria-label="조회수와 반응을 설정값으로 리셋" onClick={resetToSettings}>
              <Share2 /><span>공유</span>
            </button>
            <button type="button" aria-label="기능 설명 열기" onClick={(event) => { event.stopPropagation(); setHelpOpen(true); }}>
              <Expand /><span>리믹스</span>
            </button>
          </div>

          <div className="channel-row" data-no-count>
            <div className="channel-avatar">혜</div>
            <div className="channel-copy">
              <strong>혜민의 교실생활</strong>
              <span>구독자 {formatCount(settings.subscriberCount)}명</span>
            </div>
            <button type="button" className="subscribe-button">구독</button>
          </div>

          <section className={`comments-card ${visibleComments.length > 0 ? "has-comment" : ""}`} aria-live="polite">
            <div className="comments-heading">
              <strong>댓글</strong>
              <span>{visibleComments.length}</span>
              <ChevronUp size={18} />
            </div>
            {visibleComments.length > 0 ? visibleComments.map((comment) => (
              <div className="comment comment-arrive" key={comment.id}>
                <div className="comment-avatar">{comment.author.replace("@", "").slice(0, 1) || "ㅇ"}</div>
                <div>
                  <span>{comment.author} · 방금 전</span>
                  <p>{comment.text}</p>
                </div>
              </div>
            )) : (
              <p className="empty-comment">아직 댓글이 없습니다.</p>
            )}
          </section>

        </div>

        <nav className="bottom-nav" data-no-count aria-label="앱 하단 메뉴">
          <button type="button"><Home /><span>홈</span></button>
          <button type="button"><Search /><span>Shorts</span></button>
          <button type="button" className="create-button" aria-label="만들기"><Plus /></button>
          <button type="button"><MessageCircle /><span>구독</span></button>
          <Link href="/settings" aria-label="프로필 및 촬영 설정">
            <span className="nav-avatar">혜</span><span>나</span>
          </Link>
        </nav>

        {descriptionOpen && (
          <div className="description-layer" data-no-count role="dialog" aria-modal="true" aria-labelledby="description-title">
            <button type="button" className="description-backdrop" onClick={() => setDescriptionOpen(false)} aria-label="설명 닫기" />
            <section className="description-sheet">
              <header>
                <h2 id="description-title">설명</h2>
                <button type="button" onClick={() => setDescriptionOpen(false)} aria-label="설명 닫기"><X /></button>
              </header>
              <div className="description-body">
                <h3>{settings.videoTitle}</h3>
                <div className="description-stats">
                  <div><strong>{formatCount(displayLikeCount)}</strong><span>좋아요</span></div>
                  <div><strong>{formatCount(settings.viewCount)}</strong><span>조회수</span></div>
                  {settings.uploadDateText.trim() && (
                    <div><strong>{settings.uploadDateText.trim()}</strong><span>업로드</span></div>
                  )}
                </div>
                <div className="hashtag-chips" aria-label="동영상 해시태그">
                  {parseHashtags(settings.hashtags).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="description-copy">
                  <p>{settings.videoTitle}</p>
                  <p className="description-hashtags">{settings.hashtags}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {helpOpen && (
          <div className="description-layer" data-no-count role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button type="button" className="description-backdrop" onClick={() => setHelpOpen(false)} aria-label="기능 설명 닫기" />
            <section className="description-sheet help-sheet">
              <header>
                <h2 id="help-title">기능 설명</h2>
                <button type="button" onClick={() => setHelpOpen(false)} aria-label="기능 설명 닫기"><X /></button>
              </header>
              <div className="description-body help-body">
                <h3>촬영 화면</h3>
                <ul>
                  <li>버튼이 아닌 빈 화면을 누르면 조회수가 1 증가합니다. 키보드 Space/Enter도 동일합니다.</li>
                  <li>좋아요·싫어요 버튼은 실제로 눌리며, 다시 누르면 취소됩니다.</li>
                  <li><strong>공유</strong> 버튼: 조회수와 좋아요·싫어요 반응을 촬영 설정에 저장된 값으로 즉시 리셋합니다. 재촬영(테이크) 사이에 사용하세요.</li>
                  <li><strong>리믹스</strong> 버튼: 지금 보고 있는 이 기능 설명을 엽니다.</li>
                  <li>제목 옆 화살표를 누르면 설명(하단 시트) 창이 열립니다.</li>
                  <li>하단 메뉴 맨 오른쪽 <strong>혜 / 나</strong> 프로필을 누르면 촬영 설정으로 이동합니다.</li>
                </ul>
                <h3>촬영 설정 화면</h3>
                <ul>
                  <li>조회수 시작 숫자를 직접 입력하거나 45회·97회 장면 버튼으로 빠르게 초기화합니다.</li>
                  <li>상단 상태 표시줄을 숨기거나 촬영용 가짜 시간·배터리로 바꿉니다.</li>
                  <li>영상 제목·해시태그·업로드 날짜 문구·구독자 수·좋아요/싫어요 수·현재 반응 상태·멈춘 시점·재생 버튼 표시 여부를 편집합니다.</li>
                  <li>썸네일 카드에서 새 이미지를 올리거나 기본 썸네일로 되돌립니다.</li>
                  <li>댓글마다 작성자·내용·등장 조회수·지연 시간을 설정합니다.</li>
                  <li>전체화면으로 촬영을 시작하거나 일반 화면으로 돌아갑니다.</li>
                </ul>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
