"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BatteryMedium,
  Clock3,
  Fullscreen,
  MessageCircle,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  formatCount,
  PropComment,
  PropSettings,
  readStoredSettings,
  saveStoredSettings,
  VIDEO_DURATION_SECONDS,
} from "../lib/prop-settings";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PropSettings>(DEFAULT_SETTINGS);
  const [startDraft, setStartDraft] = useState(String(DEFAULT_SETTINGS.startCount));
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredSettings();
    setSettings(stored);
    setStartDraft(String(stored.startCount));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveStoredSettings(settings);
  }, [ready, settings]);

  const updateComment = (id: string, changes: Partial<PropComment>) => {
    setSettings((current) => ({
      ...current,
      comments: current.comments.map((comment) => comment.id === id ? { ...comment, ...changes } : comment),
    }));
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

  const addComment = () => {
    setSettings((current) => ({
      ...current,
      comments: [...current.comments, {
        id: crypto.randomUUID(),
        author: "@새시청자",
        text: "새 댓글 내용을 입력하세요.",
        triggerCount: current.viewCount,
        delaySeconds: 0,
      }],
    }));
  };

  const openFilmingFullscreen = async () => {
    setNotice("");
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
      router.push("/");
    } catch {
      setNotice("이 브라우저에서는 전체화면을 시작할 수 없습니다. 일반 촬영 화면으로 이동합니다.");
      router.push("/");
    }
  };

  return (
    <main className="settings-shell">
      <section className="settings-page">
        <header className="settings-header">
          <Link href="/" aria-label="촬영 화면으로 돌아가기"><ArrowLeft /></Link>
          <div>
            <span>VIEWTUBE PROP</span>
            <h1>촬영 설정</h1>
          </div>
        </header>

        <div className="settings-body">
          <section className="settings-card">
            <div className="settings-card-heading">
              <span>01</span>
              <div><h2>조회수</h2><p>장면 시작 숫자와 현재 숫자를 맞춥니다.</p></div>
            </div>
            <form onSubmit={handleStartSubmit} className="setting-block">
              <label htmlFor="start-count">조회수 시작 숫자</label>
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
              <p className="current-value">현재 촬영 화면: <strong>{formatCount(settings.viewCount)}회</strong></p>
            </form>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span>02</span>
              <div><h2>상단 상태 표시</h2><p>시간 표시를 숨기거나 가짜 정보로 바꿉니다.</p></div>
            </div>
            <div className="segmented-control" role="group" aria-label="상태 표시줄 모드">
              <button
                type="button"
                className={!settings.showFakeStatusBar ? "active" : ""}
                onClick={() => setSettings((current) => ({ ...current, showFakeStatusBar: false }))}
              >완전히 숨김</button>
              <button
                type="button"
                className={settings.showFakeStatusBar ? "active" : ""}
                onClick={() => setSettings((current) => ({ ...current, showFakeStatusBar: true }))}
              >가짜 표시</button>
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
          </section>

          <section className="settings-card comments-settings-card">
            <div className="settings-card-heading">
              <span>03</span>
              <div><h2>영상 정보</h2><p>촬영 화면과 설명 창에 같은 정보가 표시됩니다.</p></div>
            </div>
            <div className="setting-block">
              <label htmlFor="video-title">영상 제목</label>
              <input
                id="video-title"
                value={settings.videoTitle}
                onChange={(event) => setSettings((current) => ({ ...current, videoTitle: event.target.value }))}
              />
              <label htmlFor="video-hashtags">해시태그</label>
              <input
                id="video-hashtags"
                value={settings.hashtags}
                onChange={(event) => setSettings((current) => ({ ...current, hashtags: event.target.value }))}
                placeholder="#발표꿀팁 #학교생활"
              />
              <p>띄어쓰기 또는 쉼표로 여러 개를 구분하세요.</p>
              <label htmlFor="paused-at">영상이 멈춘 시점(초)</label>
              <input
                id="paused-at"
                type="number"
                inputMode="numeric"
                min="0"
                max={VIDEO_DURATION_SECONDS}
                value={settings.pausedAtSeconds}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  pausedAtSeconds: Math.min(VIDEO_DURATION_SECONDS, Math.max(0, Number(event.target.value))),
                }))}
              />
              <p>0~{VIDEO_DURATION_SECONDS}초 사이로 입력하세요. 기본값은 3초입니다.</p>
              <span className="setting-label">중앙 재생 버튼</span>
              <div className="segmented-control" role="group" aria-label="중앙 재생 버튼 표시">
                <button
                  type="button"
                  className={!settings.showPlayButton ? "active" : ""}
                  onClick={() => setSettings((current) => ({ ...current, showPlayButton: false }))}
                >숨김</button>
                <button
                  type="button"
                  className={settings.showPlayButton ? "active" : ""}
                  onClick={() => setSettings((current) => ({ ...current, showPlayButton: true }))}
                >표시</button>
              </div>
            </div>
          </section>

          <section className="settings-card comments-settings-card">
            <div className="settings-card-heading">
              <span>04</span>
              <div><h2>댓글과 등장 타이밍</h2><p>조회수 기준에 도달한 뒤 몇 초 후 나올지 정합니다.</p></div>
            </div>

            <div className="comment-editor-list">
              {settings.comments.map((comment, index) => (
                <article className="comment-editor" key={comment.id}>
                  <div className="comment-editor-title">
                    <span><MessageCircle /> 댓글 {index + 1}</span>
                    <button
                      type="button"
                      aria-label={`댓글 ${index + 1} 삭제`}
                      onClick={() => setSettings((current) => ({
                        ...current,
                        comments: current.comments.filter((item) => item.id !== comment.id),
                      }))}
                    ><Trash2 /></button>
                  </div>
                  <label>
                    <span>작성자</span>
                    <input value={comment.author} onChange={(event) => updateComment(comment.id, { author: event.target.value })} />
                  </label>
                  <label>
                    <span>댓글 내용</span>
                    <textarea value={comment.text} onChange={(event) => updateComment(comment.id, { text: event.target.value })} />
                  </label>
                  <div className="two-column-fields">
                    <label>
                      <span>등장 조회수</span>
                      <input
                        type="number"
                        min="0"
                        value={comment.triggerCount}
                        onChange={(event) => updateComment(comment.id, { triggerCount: Math.max(0, Number(event.target.value)) })}
                      />
                    </label>
                    <label>
                      <span>도달 후 지연(초)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={comment.delaySeconds}
                        onChange={(event) => updateComment(comment.id, { delaySeconds: Math.max(0, Number(event.target.value)) })}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
            <button type="button" className="add-comment-button" onClick={addComment}><Plus /> 댓글 추가</button>
          </section>

          {notice && <p className="notice" role="status">{notice}</p>}

          <div className="settings-actions">
            <button type="button" className="fullscreen-button" onClick={openFilmingFullscreen}>
              <Fullscreen /> 전체화면으로 촬영 시작
            </button>
            <Link href="/" className="back-to-film">일반 화면으로 돌아가기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
