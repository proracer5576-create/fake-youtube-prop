# ViewTube Film Prop

영화 촬영을 위해 만든 가상의 모바일 동영상 앱 화면입니다. 빈 화면을 한 번 터치할 때마다 조회수가 1씩 증가하고, 설정한 조회수와 시간에 맞춰 댓글이 순서대로 나타납니다.

## 주요 기능

- 터치 한 번마다 조회수 1 증가
- 기본 45회 댓글, 100회 댓글 및 지연 댓글 연출
- 댓글 내용·작성자·등장 조회수·지연 시간 편집
- 영상 제목·해시태그·멈춘 시점·재생 버튼 표시 설정
- 실제 시스템 표시줄 숨김과 수정 가능한 가짜 상태 표시줄
- 모바일 세로 화면 및 데스크톱 430px 휴대폰 프레임
- 설정값을 브라우저에 자동 저장

하단 메뉴 맨 오른쪽의 `혜 / 나` 프로필을 누르면 촬영 설정으로 들어갑니다.

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

개발 주소는 `http://localhost:3000`입니다.

## 검증

```bash
npx tsc --noEmit
npm test
npm run build:pages
```

## 배포

`.github/workflows/deploy-pages.yml`이 `main` 또는 `agent/github-pages-deploy` 브랜치의 변경을 정적 사이트로 빌드해 GitHub Pages에 배포합니다.

## 오프라인 단일 HTML

`standalone/viewtube-prop.html`은 썸네일·스타일·동작을 모두 포함한 한 파일짜리 버전입니다. 인터넷 연결 없이 파일을 브라우저로 열어 사용할 수 있습니다.

다시 생성하려면 다음 명령을 실행합니다.

```bash
npm run build:standalone
```
