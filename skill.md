# SteelMan Project Context

## Project Overview
**Name:** SteelMan
**Goal:** A "Critical Thinking Analysis Platform" designed to help users understand opposing arguments (Steel-manning) rather than just winning debates. It combats confirmation bias by verifying primary sources, exploring diverse perspectives, and analyzing bias patterns.
**Tagline:** "Same facts, different conclusions. Why did you reach that conclusion?"

## Core Problem & Solution
- **Problem:** Existing media literacy tools assume users *want* to correct their bias, which fails due to psychological reactance. People primarily want to *win* arguments.
- **Solution:** SteelMan positions itself as a tool to "understand the opponent's logic to win," inadvertently triggering critical thinking.
- **differentiation:** Not a chatbot. It's a dashboard that fills up with analysis (3 panels) while the user inputs content.

## Architecture: Multi-Agent System
The system orchestrates multiple AI agents to analyze content in real-time:

1.  **Agent A (Analyzer - Orchestrator):**
    *   **Role:** Background processor, invisible to user.
    *   **Functions:** Content parsing (URL/Text/Image via Gemini Multimodal Vision), Argument structuring (Deep Think Reasoning), Bias detection, Orchestration of other agents.
2.  **Agent B (Primary Source Verifier):**
    *   **Role:** Checks facts.
    *   **Functions:** Finds original sources (Search Grounding), detects distortions/context omissions, assigns Credibility Score (0-100).
3.  **Agent C (Perspective Explorer):**
    *   **Role:** Broadens view.
    *   **Functions:** Finds 3-5 diverse perspectives on the same issue, analyzes frames, maps views on a spectrum (Left-Right, Simple-Complex).
4.  **Agent D (Socrates - Dialogue):**
    *   **Role:** Engagement.
    *   **Functions:** Asks questions to provoke thought (e.g., "What part of this argument makes the least sense?"). Uses "Thought Signatures" to maintain context.

## User Interface (UI)
- **Input:** URL, Text, or Screenshot.
- **Output:** 3-Panel Dashboard (updates in real-time):
    1.  **Primary Source:** Original link, distortion check, credibility score.
    2.  **Perspectives:** Perspective cards, Spectrum map.
    3.  **Bias Analysis:** Radar chart (Hans Rosling 10 Instincts), Top 3 biases, text highlights.
- **Final Output:** Shareable "Analysis Card" summarizing the steel-manned argument.

## Tech Stack
- **AI Core:** Gemini 3 Pro API (Deep Think mode).
- **Search:** Gemini API + Google Search Grounding.
- **Frontend:** Next.js (React) + Tailwind CSS.
- **Backend:** Python FastAPI (Planned/integrated).
- **Visualization:** D3.js (Radar charts, Spectrum maps).

## Key Features
- **Thought Signatures:** Continuous reasoning context across multi-turn interactions.
- **Multimodal Analysis:** Can analyze screenshots/images of articles.
- **60-Second Demo Flow:** Designed to show full value within 1 minute (Input -> Source Check -> Perspectives -> Bias Analysis).

## Development Context
- **Hackathon Track:** Gemini for Good.
- **Current Status:** MVP Development.
- **Repo Structure:** Next.js application (App Router).
