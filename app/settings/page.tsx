"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BatteryMedium,
  Clock3,
  Fullscreen,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  formatCount,
  parseHashtags,
  PropComment,
  PropSettings,
  readSavedScenes,
  readStoredSettings,
  resizeImageFileToDataUrl,
  SavedScene,
  saveSavedScenes,
  saveStoredSettings,
  UserReaction,
  VIDEO_DURATION_SECONDS,
} from "../lib/prop-settings";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PropSettings>(DEFAULT_SETTINGS);
  const [startDraft, setStartDraft] = useState(String(DEFAULT_SETTINGS.startCount));
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const [scenes, setScenes] = useState<SavedScene[]>([]);
  const [sceneName, setSceneName] = useState("");

  useEffect(() => {
    const stored = readStoredSettings();
    setSettings(stored);
    setStartDraft(String(stored.startCount));
    setScenes(readSavedScenes());
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

  const applySceneStart = (nextStart: number) => {
    setSettings((current) => ({ ...current, startCount: nextStart, viewCount: nextStart }));
    setStartDraft(String(nextStart));
    setNotice(`${formatCount(nextStart)}회 장면으로 초기화했습니다.`);
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

  const handleThumbnailFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setThumbnailError("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      setThumbnailError("");
      setSettings((current) => ({ ...current, thumbnailUrl: dataUrl }));
    } catch {
      setThumbnailError("썸네일을 불러오지 못했습니다. 다른 이미지를 시도해 주세요.");
    }
  };

  const resetThumbnail = () => {
    setSettings((current) => ({ ...current, thumbnailUrl: "" }));
    setThumbnailError("");
  };

  const setReaction = (reaction: UserReaction) => {
    setSettings((current) => ({ ...current, userReaction: reaction }));
  };

  const saveCurrentScene = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = sceneName.trim();
    if (!name) {
      setNotice("장면 이름을 입력해 주세요.");
      return;
    }
    const scene: SavedScene = { id: crypto.randomUUID(), name, savedAt: Date.now(), settings };
    setScenes((current) => {
      const next = [...current, scene];
      saveSavedScenes(next);
      return next;
    });
    setSceneName("");
    setNotice(`"${name}" 장면을 저장했습니다.`);
  };

  const loadScene = (id: string) => {
    const scene = scenes.find((item) => item.id === id);
    if (!scene) return;
    setSettings(scene.settings);
    setStartDraft(String(scene.settings.startCount));
    setNotice(`"${scene.name}" 장면을 불러왔습니다.`);
  };

  const deleteScene = (id: string) => {
    setScenes((current) => {
      const next = current.filter((item) => item.id !== id);
      saveSavedScenes(next);
      return next;
    });
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
              <div className="quick-reset-grid" aria-label="장면별 조회수 빠른 초기화">
                <button type="button" className="secondary-button" onClick={() => applySceneStart(45)}>
                  <RotateCcw /> 45회로 초기화
                </button>
                <button type="button" className="secondary-button" onClick={() => applySceneStart(97)}>
                  <RotateCcw /> 97회로 초기화
                </button>
              </div>
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
              {parseHashtags(settings.hashtags).length > 0 && (
                <div className="hashtag-preview" aria-label="해시태그 미리보기">
                  {parseHashtags(settings.hashtags).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
              <div className="two-column-fields">
                <label htmlFor="like-count">
                  <span>좋아요 수</span>
                  <input
                    id="like-count"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={settings.likeCount}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      likeCount: Math.max(0, Math.floor(Number(event.target.value))),
                    }))}
                  />
                </label>
                <label htmlFor="dislike-count">
                  <span>싫어요 수</span>
                  <input
                    id="dislike-count"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={settings.dislikeCount}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      dislikeCount: Math.max(0, Math.floor(Number(event.target.value))),
                    }))}
                  />
                </label>
              </div>
              <span className="setting-label">현재 반응 상태</span>
              <div className="segmented-control three-way" role="group" aria-label="좋아요·싫어요 반응 상태">
                <button
                  type="button"
                  className={settings.userReaction === "none" ? "active" : ""}
                  onClick={() => setReaction("none")}
                >반영 안 함</button>
                <button
                  type="button"
                  className={settings.userReaction === "like" ? "active" : ""}
                  onClick={() => setReaction("like")}
                >좋아요 눌림</button>
                <button
                  type="button"
                  className={settings.userReaction === "dislike" ? "active" : ""}
                  onClick={() => setReaction("dislike")}
                >싫어요 눌림</button>
              </div>
              <p>촬영 화면에는 위 기준값에 반응 상태가 더해져 표시됩니다. 배우가 직접 버튼을 눌러도 즉시 반영되며, 촬영 화면의 공유 버튼을 누르면 조회수와 함께 이 반응 상태가 초기화됩니다.</p>
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

          <section className="settings-card">
            <div className="settings-card-heading">
              <span>04</span>
              <div><h2>썸네일</h2><p>영상 썸네일 이미지를 직접 올려 바꿀 수 있습니다.</p></div>
            </div>
            <div className="setting-block thumbnail-picker">
              <div className="thumbnail-preview">
                <img
                  src={settings.thumbnailUrl || `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/movie-thumbnail.webp`}
                  alt="현재 설정된 썸네일 미리보기"
                />
              </div>
              <label className="thumbnail-upload-button">
                <ImageIcon /> 이미지 선택
                <input type="file" accept="image/*" onChange={handleThumbnailFile} hidden />
              </label>
              <button
                type="button"
                className={`secondary-button thumbnail-reset-button ${settings.thumbnailUrl ? "" : "is-hidden"}`}
                onClick={resetThumbnail}
                tabIndex={settings.thumbnailUrl ? 0 : -1}
                aria-hidden={!settings.thumbnailUrl}
              >
                기본 썸네일로 되돌리기
              </button>
              {thumbnailError && <p className="notice" role="alert">{thumbnailError}</p>}
              <p>브라우저 저장 용량을 아끼기 위해 이미지는 자동으로 축소·압축됩니다. 이 컴퓨터/기기에만 저장되며 촬영팀 전체에 공유되지 않습니다.</p>
            </div>
          </section>

          <section className="settings-card comments-settings-card">
            <div className="settings-card-heading">
              <span>05</span>
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

          <section className="settings-card">
            <div className="settings-card-heading">
              <span>06</span>
              <div><h2>저장된 장면</h2><p>제목·썸네일·댓글 등 지금 설정 전체를 이름 붙여 저장하고 나중에 불러옵니다.</p></div>
            </div>
            <form onSubmit={saveCurrentScene} className="setting-block">
              <label htmlFor="scene-name">현재 설정을 새 장면으로 저장</label>
              <div className="input-action-row">
                <input
                  id="scene-name"
                  value={sceneName}
                  onChange={(event) => setSceneName(event.target.value)}
                  placeholder="예: 도서관 장면"
                />
                <button type="submit" className="primary-button">저장</button>
              </div>
            </form>
            {scenes.length > 0 ? (
              <ul className="scene-list">
                {scenes.map((scene) => (
                  <li className="scene-item" key={scene.id}>
                    <div className="scene-item-info">
                      <strong>{scene.name}</strong>
                      <span>{new Date(scene.savedAt).toLocaleString("ko-KR")}</span>
                    </div>
                    <div className="scene-item-actions">
                      <button type="button" className="secondary-button" onClick={() => loadScene(scene.id)}>
                        불러오기
                      </button>
                      <button type="button" aria-label={`${scene.name} 장면 삭제`} onClick={() => deleteScene(scene.id)}>
                        <Trash2 />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-scene">아직 저장된 장면이 없습니다.</p>
            )}
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
