"use client";

import Image from "next/image";
import {
  BatteryMedium,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock3,
  Expand,
  Fullscreen,
  Home,
  MessageCircle,
  MoreVertical,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Share2,
  Signal,
  ThumbsDown,
  ThumbsUp,
  Wifi,
  X,
} from "lucide-react";
import { FormEvent, MouseEvent, useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "viewtube-prop-settings-v1";
const DEFAULT_START_COUNT = 97;

type StoredSettings = {
  startCount: number;
  viewCount: number;
  showFakeStatusBar: boolean;
  fakeTime: string;
  battery: number;
};

const DEFAULT_SETTINGS: StoredSettings = {
  startCount: DEFAULT_START_COUNT,
  viewCount: DEFAULT_START_COUNT,
  showFakeStatusBar: false,
  fakeTime: "9:36",
  battery: 20,
};

function readStoredSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const stored = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      startCount: Number.isFinite(stored.startCount) ? Number(stored.startCount) : DEFAULT_START_COUNT,
      viewCount: Number.isFinite(stored.viewCount) ? Number(stored.viewCount) : DEFAULT_START_COUNT,
      showFakeStatusBar: Boolean(stored.showFakeStatusBar),
      fakeTime: typeof stored.fakeTime === "string" ? stored.fakeTime : DEFAULT_SETTINGS.fakeTime,
      battery: Number.isFinite(stored.battery)
        ? Math.min(100, Math.max(0, Number(stored.battery)))
        : DEFAULT_SETTINGS.battery,
    };
  } catch {
    // 손상된 로컬 설정은 촬영 기본값으로 안전하게 복구한다.
    return DEFAULT_SETTINGS;
  }
}

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

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function HomePage() {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [startDraft, setStartDraft] = useState(String(DEFAULT_START_COUNT));
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredSettings();
    setSettings(stored);
    setStartDraft(String(stored.startCount));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // 저장이 막혀도 현재 촬영 세션의 기능은 계속 동작한다.
    }
  }, [ready, settings]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const increaseViewCount = useCallback(() => {
    setSettings((current) => ({ ...current, viewCount: current.viewCount + 1 }));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, button, textarea, select")) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        increaseViewCount();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [increaseViewCount]);

  const handleSurfaceClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-count]")) return;
    increaseViewCount();
  };

  const handleStartSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextStart = Number.parseInt(startDraft, 10);
    if (!Number.isFinite(nextStart) || nextStart < 0) {
      setNotice("시작 조회수는 0 이상의 숫자로 입력해 주세요.");
      return;
    }
    setSettings((current) => ({ ...current, startCount: nextStart, viewCount: nextStart }));
    setStartDraft(String(nextStart));
    setNotice(`${formatCount(nextStart)}회로 설정했습니다.`);
  };

  const resetViewCount = () => {
    setSettings((current) => ({ ...current, viewCount: current.startCount }));
    setStartDraft(String(settings.startCount));
    setNotice(`${formatCount(settings.startCount)}회로 되돌렸습니다.`);
  };

  const toggleFullscreen = async () => {
    setNotice("");
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      setNotice("이 브라우저에서는 전체화면을 시작할 수 없습니다. 브라우저 메뉴의 전체화면을 이용해 주세요.");
    }
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
          <Image
            src="/movie-thumbnail.webp"
            alt="교실에서 세 학생이 발표할 때 긴장하지 않는 팁을 소개하는 영상 썸네일"
            fill
            priority
            sizes="(max-width: 560px) 100vw, 560px"
          />
          <div className="video-shade" />
          <span className="pause-play" aria-hidden="true"><Play size={38} fill="white" /></span>
          <span className="video-time">1:28 / 2:16</span>
          <div className="progress-track" aria-label="영상 재생 진행률 65%">
            <div className="progress-value" />
            <span className="progress-thumb" />
          </div>
        </div>

        <div className="video-content">
          <div className="title-row">
            <h1>발표할 때 심장 안 떨리는 꿀팁!</h1>
            <button type="button" data-no-count aria-label="동영상 메뉴"><MoreVertical /></button>
          </div>
          <p className="metadata" aria-live="polite">
            조회수 <strong key={settings.viewCount} className="count-pop">{formatCount(settings.viewCount)}회</strong>
            <span>·</span> 2일 전
          </p>

          <div className="action-rail" data-no-count>
            <button type="button" aria-label="좋아요 12개"><ThumbsUp /><strong>12</strong></button>
            <button type="button" aria-label="싫어요"><ThumbsDown /><span>싫어요</span></button>
            <button type="button" aria-label="공유"><Share2 /><span>공유</span></button>
            <button type="button" aria-label="리믹스"><Expand /><span>리믹스</span></button>
          </div>

          <div className="channel-row" data-no-count>
            <div className="channel-avatar">혜</div>
            <div className="channel-copy">
              <strong>혜민의 교실생활</strong>
              <span>구독자 128명</span>
            </div>
            <button type="button" className="subscribe-button">구독</button>
          </div>

          <section className={`comments-card ${settings.viewCount >= 100 ? "has-comment" : ""}`} aria-live="polite">
            <div className="comments-heading">
              <strong>댓글</strong>
              <span>{settings.viewCount >= 100 ? "1" : "0"}</span>
              <ChevronUp size={18} />
            </div>
            {settings.viewCount >= 100 ? (
              <div className="comment comment-arrive">
                <div className="comment-avatar">ㅇ</div>
                <div>
                  <span>@웃긴거좋아 · 방금 전</span>
                  <p>솔직히 재미없어요... 하나도 안 웃김..ㅋㅋㅋㅋ</p>
                </div>
              </div>
            ) : (
              <p className="empty-comment">조회수 100회가 되면 새 댓글이 표시됩니다.</p>
            )}
          </section>

          <p className="tap-hint"><Plus size={15} /> 화면의 빈 곳을 한 번 터치하면 조회수가 1 올라갑니다</p>

          <section className="control-section" data-no-count aria-labelledby="control-title">
            <button
              type="button"
              className="control-toggle"
              onClick={() => setControlsOpen((open) => !open)}
              aria-expanded={controlsOpen}
              aria-controls="prop-controls"
            >
              <span><Settings2 /> <strong id="control-title">촬영 설정</strong></span>
              {controlsOpen ? <ChevronUp /> : <ChevronDown />}
            </button>

            {controlsOpen && (
              <div className="control-panel" id="prop-controls">
                <form onSubmit={handleStartSubmit} className="setting-block">
                  <label htmlFor="start-count">조회수 시작 숫자</label>
                  <p>숫자를 저장하면 현재 조회수도 바로 그 숫자가 됩니다.</p>
                  <div className="input-action-row">
                    <input
                      id="start-count"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={startDraft}
                      onChange={(event) => setStartDraft(event.target.value)}
                    />
                    <button type="submit" className="primary-button">설정</button>
                  </div>
                  <button type="button" className="secondary-button" onClick={resetViewCount}>
                    <RotateCcw /> 저장된 {formatCount(settings.startCount)}회로 초기화
                  </button>
                </form>

                <div className="setting-block">
                  <span className="setting-label">상단 상태 표시</span>
                  <p>전체화면에서는 실제 시스템 표시줄이 숨겨집니다.</p>
                  <div className="segmented-control" role="group" aria-label="상태 표시줄 모드">
                    <button
                      type="button"
                      className={!settings.showFakeStatusBar ? "active" : ""}
                      onClick={() => setSettings((current) => ({ ...current, showFakeStatusBar: false }))}
                    >
                      완전히 숨김
                    </button>
                    <button
                      type="button"
                      className={settings.showFakeStatusBar ? "active" : ""}
                      onClick={() => setSettings((current) => ({ ...current, showFakeStatusBar: true }))}
                    >
                      가짜 표시
                    </button>
                  </div>
                </div>

                {settings.showFakeStatusBar && (
                  <div className="two-column-fields">
                    <label>
                      <span><Clock3 /> 표시 시간</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={settings.fakeTime}
                        onChange={(event) => setSettings((current) => ({ ...current, fakeTime: event.target.value }))}
                        placeholder="9:36"
                      />
                    </label>
                    <label>
                      <span><BatteryMedium /> 배터리 %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.battery}
                        onChange={(event) => setSettings((current) => ({
                          ...current,
                          battery: Math.min(100, Math.max(0, Number(event.target.value))),
                        }))}
                      />
                    </label>
                  </div>
                )}

                <button type="button" className="fullscreen-button" onClick={toggleFullscreen}>
                  {isFullscreen ? <X /> : <Fullscreen />}
                  {isFullscreen ? "전체화면 나가기" : "전체화면으로 촬영하기"}
                </button>

                {notice && <p className="notice" role="status">{notice}</p>}
              </div>
            )}
          </section>
        </div>

        <nav className="bottom-nav" data-no-count aria-label="앱 하단 메뉴">
          <button type="button"><Home /><span>홈</span></button>
          <button type="button"><Search /><span>Shorts</span></button>
          <button type="button" className="create-button" aria-label="만들기"><Plus /></button>
          <button type="button"><MessageCircle /><span>구독</span></button>
          <button type="button"><span className="nav-avatar">혜</span><span>나</span></button>
        </nav>
      </section>
    </main>
  );
}
