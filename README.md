# 집회 안내 페이지 (현재 공개 중)

집회마다 **시작일(년월일 6자리) 폴더**가 하나씩 있고, 주소도 그 폴더 이름입니다.

```
index.html        기본 주소 → 다가오는 집회 폴더로 자동 이동 (events.json 기준)
events.json       집회 목록 (폴더 이름, 제목, 시작일, 종료일)
assets/event.css  모든 집회 페이지 공통 디자인
assets/event.js   모든 집회 페이지 공통 동작 + 화면 문구 번역(TEXT)
261008/           2026 가을 한국 집회   → …/gathering-2026f-r9k2/261008
261016/           2026 태국 집회        → …/gathering-2026f-r9k2/261016
261030/           2026 필리핀 집회      → …/gathering-2026f-r9k2/261030
  ├─ index.html   링크 미리보기용 제목·설명 + 공통 파일 불러오기
  └─ event.json   그 집회의 내용 (제목, 장소, 날짜, 주제, 세션, Zoom)
admin.html        관리자 화면: 집회 만들기·수정 (암호 로그인, Apps Script를 거쳐 GitHub에 커밋)
```

새 집회 추가: `admin.html` → "새 집회 만들기" → 시작일 선택(주소가 정해짐) → 내용 입력 → 저장하고 배포.
저장할 때마다 그 집회의 `event.json`, `index.html`(링크 미리보기), `events.json` 이 한 커밋으로 함께 저장됩니다.
주소는 처음 만들 때 정해지고, 나중에 날짜를 바꿔도 그대로입니다. 같은 날 시작하는 집회가 또 있으면 `-2` 가 붙습니다.

관리자 화면(`admin.html`): 관리자 암호로 들어갑니다. 암호 확인, GitHub 읽기·저장, AI 번역은 Google Apps Script
웹앱(문지기)이 처리하고, 관리자 암호·GitHub 토큰·Claude API 키는 그 Apps Script의 스크립트 속성에만 있습니다.
Apps Script 코드는 저장소 밖(`apps-script/`, gitignore)에 보관합니다. 암호를 5번 틀리면 15분 동안 잠기고,
문지기는 집회 폴더의 `event.json`·`index.html`과 `events.json`만 고칠 수 있습니다.

---

예전 "2026년 가을 집회 참가 접수" 웹앱(접수 폼·접수 현황 화면, Google 스프레드시트 연동)은
2026년 11월에 저장소에서 내렸습니다. 코드는 git 기록(마지막 버전: 커밋 `12d699b`)에 남아 있습니다.
