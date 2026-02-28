# Flipside 스캐폴딩

프로젝트 컨벤션에 맞는 파일을 빠르게 생성합니다.

## 사용법

`$ARGUMENTS` 형식: `<타입> <이름>` (예: `panel Bias`, `agent summarizer`, `api share`)

## 타입별 생성 규칙

먼저 CLAUDE.md를 읽어서 현재 프로젝트 구조와 컨벤션을 확인하세요.

### `panel <이름>` — 분석 패널 컴포넌트
- 경로: `app/components/panels/<이름>Panel.tsx`
- 클라이언트 컴포넌트 (`'use client'`)
- 프로젝트의 Compound Component 패턴 적용
- 기존 패널 (SourcePanel, PerspectivePanel, BiasPanel) 스타일과 통일

### `agent <이름>` — AI 에이전트 로직
- 경로: `lib/agents/<이름>.ts`
- AgentState 타입 사용
- Gemini client import 포함
- 기존 에이전트 (analyzer, source-verifier, perspective, socrates) 패턴 따르기

### `api <이름>` — API 라우트
- 경로: `app/api/<이름>/route.ts`
- ApiResponse<T> 타입 사용
- Result 패턴 에러 핸들링

### `component <이름>` — 일반 컴포넌트
- 경로: `app/components/<적절한 폴더>/<이름>.tsx`
- 서버 컴포넌트 기본, 상호작용 필요시 클라이언트

### `store <이름>` — Zustand 스토어
- 경로: `lib/store/use<이름>Store.ts`
- 기존 스토어 (useAnalysisStore, useAgentStore) 패턴 따르기

### `type <이름>` — 타입 정의
- 경로: `lib/types/<이름>.ts`
- Discriminated Union 패턴 적극 활용

## 생성 후

1. 파일 생성
2. 기존 유사 파일이 있으면 참고하여 패턴 통일
3. 필요시 관련 파일에 import/export 추가
4. **`/update-docs` 호출이 필요한지 사용자에게 안내** (새 파일이 프로젝트 구조에 영향을 주므로)

## 실행

요청: $ARGUMENTS
