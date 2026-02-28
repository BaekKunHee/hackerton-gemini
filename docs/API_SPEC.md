# Flipside Backend API Specification

> FastAPI 기반 실제 구현 API 명세

## Base URL

```
http://localhost:8000
```

## OpenAPI Documentation

서버 실행 후 자동 생성되는 문서:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Endpoints

### 1. Health Check

```http
GET /api/health
```

서버 상태 확인

**Response**
```json
{
  "status": "healthy"
}
```

---

### 2. Start Analysis

```http
POST /api/analyze
```

새로운 분석 세션을 시작합니다.

**Request Body**
```json
{
  "type": "url" | "text" | "image",
  "content": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | 콘텐츠 타입: `url`, `text`, `image` |
| `content` | string | 분석할 URL, 텍스트, 또는 base64 이미지 |

**Response** `200 OK`
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "stream_url": "/api/stream/550e8400-e29b-41d4-a716-446655440000"
}
```

**Example**
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url",
    "content": "https://example.com/news/article"
  }'
```

---

### 3. Stream Analysis (SSE)

```http
GET /api/stream/{session_id}
```

실시간 분석 상태를 Server-Sent Events로 스트리밍합니다.

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string (UUID) | 분석 세션 ID |

**Response** `200 OK` (text/event-stream)

**Event Types**

#### `agent_status`
에이전트 상태 변경 알림

```json
{
  "type": "agent_status",
  "payload": {
    "agent_id": "analyzer" | "source" | "perspective" | "socrates",
    "status": "idle" | "thinking" | "searching" | "analyzing" | "done" | "error",
    "message": "분석 중...",
    "progress": 50
  }
}
```

#### `panel_update`
패널 데이터 업데이트

**Source Panel (Primary Source 검증)**
```json
{
  "type": "panel_update",
  "panel": "source",
  "payload": {
    "sources": [
      {
        "original_claim": "원본 주장",
        "original_source": {
          "url": "https://...",
          "title": "기사 제목",
          "publisher": "출판사",
          "date": "2026-02-28",
          "relevant_quote": "관련 인용문"
        },
        "verification": {
          "status": "verified" | "distorted" | "context_missing" | "unverifiable",
          "explanation": "검증 설명",
          "comparison": "비교 내용"
        },
        "trust_score": 75
      }
    ],
    "trust_score": 72,
    "summary": "전체 요약"
  }
}
```

**Perspective Panel (다른 관점)**
```json
{
  "type": "panel_update",
  "panel": "perspective",
  "payload": {
    "perspectives": [
      {
        "id": 1,
        "source": {
          "url": "https://...",
          "title": "기사 제목",
          "publisher": "출판사"
        },
        "main_claim": "주요 주장",
        "frame": "프레임",
        "key_points": ["포인트1", "포인트2"],
        "spectrum": {
          "political": 0.5,
          "emotional": -0.2,
          "complexity": 0.7
        }
      }
    ],
    "common_facts": ["공통 팩트1", "공통 팩트2"],
    "divergence_points": [
      {
        "topic": "분기점 주제",
        "positions": ["관점1", "관점2"]
      }
    ]
  }
}
```

**Bias Panel (편향 분석)**
```json
{
  "type": "panel_update",
  "panel": "bias",
  "payload": {
    "biases": [
      {
        "type": "gap_instinct",
        "confidence": 0.8,
        "example": "예시 텍스트"
      }
    ],
    "claims": [...]
  }
}
```

#### `analysis_complete`
분석 완료

```json
{
  "type": "analysis_complete",
  "payload": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### `error`
에러 발생

```json
{
  "type": "error",
  "payload": {
    "code": "ANALYSIS_FAILED",
    "message": "분석 중 오류가 발생했습니다"
  }
}
```

**JavaScript Client Example**
```javascript
const eventSource = new EventSource('http://localhost:8000/api/stream/SESSION_ID');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'agent_status':
      console.log(`Agent ${data.payload.agent_id}: ${data.payload.status}`);
      break;
    case 'panel_update':
      console.log(`Panel ${data.panel} updated`);
      break;
    case 'analysis_complete':
      console.log('Analysis complete!');
      eventSource.close();
      break;
    case 'error':
      console.error(data.payload.message);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

---

### 4. Get Result

```http
GET /api/result/{session_id}
```

완료된 분석 결과를 조회합니다.

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string (UUID) | 분석 세션 ID |

**Response** `200 OK`
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done" | "analyzing" | "error",
  "result": { ... },
  "conversation_context": { ... }
}
```

**Error Response** `404 Not Found`
```json
{
  "detail": "Session not found"
}
```

---

### 5. Socrates Chat

```http
POST /api/chat
```

소크라테스 대화 에이전트와 대화합니다.

**Request Body**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "이 주장에서 가장 의심스러운 부분은 통계예요"
}
```

**Response** `200 OK`
```json
{
  "response": "흥미로운 지적이에요. 왜 그 통계가 의심스럽다고 느끼셨나요?",
  "step": 2,
  "is_complete": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | 소크라테스의 응답 |
| `step` | int (1-4) | 현재 대화 단계 |
| `is_complete` | bool | 4단계 완료 여부 |

**대화 단계 (Socratic Method)**
| Step | 질문 유형 |
|------|----------|
| 1 | "이 주장에서 가장 말이 안 된다고 생각하는 부분이 어디예요?" |
| 2 | "원본 데이터를 보니까 어떤 생각이 들어요?" |
| 3 | "반대 관점 중 가장 말이 되는 게 뭐예요?" |
| 4 | "지금도 처음이랑 같은 생각이에요?" |

**Example**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "통계가 왜곡된 것 같아요"
  }'
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | 잘못된 입력 형식 |
| `SESSION_NOT_FOUND` | 404 | 세션을 찾을 수 없음 |
| `ANALYSIS_FAILED` | 500 | 분석 실패 |
| `GEMINI_API_ERROR` | 500 | Gemini API 오류 |

---

## Models (Pydantic Schemas)

### AnalyzeRequest
```python
class AnalyzeRequest(BaseModel):
    type: Literal["url", "text", "image"]
    content: str
```

### AnalyzeResponse
```python
class AnalyzeResponse(BaseModel):
    session_id: str
    status: str
    stream_url: str
```

### ChatRequest
```python
class ChatRequest(BaseModel):
    session_id: str
    message: str
```

### ChatResponse
```python
class ChatResponse(BaseModel):
    response: str
    step: int  # 1-4
    is_complete: bool
```

### AgentState
```python
class AgentState(BaseModel):
    agent_id: Literal["analyzer", "source", "perspective", "socrates"]
    status: Literal["idle", "thinking", "searching", "analyzing", "done", "error"]
    message: Optional[str] = None
    progress: Optional[int] = None  # 0-100
```

---

## Configuration

### Environment Variables

```env
# Gemini API Configuration
GEMINI_API_KEY=your_api_key_here

# Default model (used for most tasks)
GEMINI_MODEL=gemini-3-flash-preview

# Pro model (Agent A: Analyzer, Agent D: Socrates)
GEMINI_MODEL_PRO=gemini-3.1-pro-preview

# Flash model (Agent B: Source, Agent C: Perspective)
GEMINI_MODEL_FLASH=gemini-3-flash-preview
```

### Model Selection by Agent

| Agent | Model | Reason |
|-------|-------|--------|
| Agent A (Analyzer) | `gemini-3.1-pro-preview` | 복잡한 추론, 편향 감지 |
| Agent B (Source Verifier) | `gemini-3-flash-preview` | 빠른 검색 기반 작업 |
| Agent C (Perspective Explorer) | `gemini-3-flash-preview` | 빠른 검색 기반 작업 |
| Agent D (Socrates) | `gemini-3.1-pro-preview` | 고품질 대화 |

---

## LangGraph Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                         START                                │
│                           │                                  │
│                           ▼                                  │
│                    ┌──────────────┐                         │
│                    │  Analyzer    │  Agent A (Pro)          │
│                    │  (Agent A)   │  - 콘텐츠 파싱           │
│                    └──────────────┘  - 주장 추출             │
│                           │          - 편향 감지             │
│              ┌────────────┼────────────┐                    │
│              │            │            │                    │
│              ▼            ▼            ▼                    │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│     │   Source     │ │ Perspective  │ │  Socrates    │     │
│     │  Verifier    │ │  Explorer    │ │   Init       │     │
│     │  (Agent B)   │ │  (Agent C)   │ │  (Agent D)   │     │
│     └──────────────┘ └──────────────┘ └──────────────┘     │
│     Flash + Search   Flash + Search   대화 컨텍스트 초기화   │
│              │            │            │                    │
│              └────────────┼────────────┘                    │
│                           │                                  │
│                           ▼                                  │
│                    ┌──────────────┐                         │
│                    │  Aggregate   │                         │
│                    │  Results     │                         │
│                    └──────────────┘                         │
│                           │                                  │
│                           ▼                                  │
│                          END                                 │
└─────────────────────────────────────────────────────────────┘

* Agent B, C, D는 병렬 실행됨
```

---

## Quick Start

```bash
# 1. 의존성 설치
cd apps/api
pip install -r requirements.txt

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에서 GEMINI_API_KEY 설정

# 3. 서버 실행
uvicorn app.main:app --reload --port 8000

# 4. API 문서 확인
open http://localhost:8000/docs
```

---

## Related Documents

- [PRD 요약](PRD.md)
- [시스템 아키텍처](ARCHITECTURE.md)
- [AI 에이전트 설계](AGENTS.md)
- [UI/UX 설계](UI.md)
