# Flipside Backend API

> LangGraph + Gemini 3 기반 비판적 사고 분석 백엔드

## Quick Start (from repo root)

```bash
npm run dev:api
```

This command does all setup automatically:

- create `apps/api/.venv` if missing
- install dependencies from `requirements.txt`
- create `.env` from `.env.example` if missing
- start `uvicorn app.main:app --reload`

**Important**: `.env` 파일에서 `GEMINI_API_KEY`를 설정해야 합니다.

## Manual Setup

```bash
cd apps/api
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
cp .env.example .env
# .env에서 GEMINI_API_KEY 설정
./.venv/bin/uvicorn app.main:app --reload
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | 서버 상태 확인 |
| POST | `/api/analyze` | 분석 시작 |
| GET | `/api/stream/{session_id}` | SSE 실시간 스트리밍 |
| GET | `/api/result/{session_id}` | 분석 결과 조회 |
| POST | `/api/chat` | Socrates 대화 |

## Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API 명세**: [docs/API_SPEC.md](../../docs/API_SPEC.md)

## Project Structure

```
app/
├── main.py                 # FastAPI 앱 엔트리
├── core/
│   ├── config.py           # 설정 (환경변수)
│   └── gemini.py           # Gemini 클라이언트
├── agents/
│   ├── graph.py            # LangGraph 상태 & 그래프
│   ├── prompts.py          # 에이전트 프롬프트
│   └── nodes/
│       ├── analyzer.py     # Agent A (분석) - Pro 모델
│       ├── source_verifier.py  # Agent B (소스 검증) - Flash 모델
│       ├── perspective.py  # Agent C (관점 탐색) - Flash 모델
│       ├── socrates.py     # Agent D (대화 초기화)
│       └── aggregate.py    # 결과 집계
├── api/routes/
│   ├── health.py           # 헬스체크
│   ├── analyze.py          # 분석 + SSE
│   ├── result.py           # 결과 조회
│   └── chat.py             # Socrates 대화 - Pro 모델
├── schemas/                # Pydantic 스키마
└── services/
    └── session.py          # 세션 관리
```

## Gemini Models

| Agent | Model | 용도 |
|-------|-------|------|
| Analyzer (A) | `gemini-3.1-pro-preview` | 복잡한 추론, 편향 감지 |
| Source (B) | `gemini-3-flash-preview` | 빠른 소스 검증 + Search |
| Perspective (C) | `gemini-3-flash-preview` | 빠른 관점 탐색 + Search |
| Socrates (D) | `gemini-3.1-pro-preview` | 고품질 대화 |

## Environment Variables

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_MODEL_PRO=gemini-3.1-pro-preview
GEMINI_MODEL_FLASH=gemini-3-flash-preview
```

## Testing

```bash
# 헬스체크
curl http://localhost:8000/api/health

# 분석 시작
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type": "text", "content": "분석할 텍스트..."}'

# SSE 스트리밍
curl http://localhost:8000/api/stream/{session_id}

# 결과 조회
curl http://localhost:8000/api/result/{session_id}

# Socrates 대화
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "...", "message": "질문..."}'
```
