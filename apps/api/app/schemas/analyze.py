"""Analysis request and response schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request to start content analysis."""

    type: Literal["url", "text", "image"] = Field(
        ..., description="Type of content being analyzed"
    )
    content: str = Field(..., description="The content to analyze (URL, text, or base64 image)")


class AnalyzeResponse(BaseModel):
    """Response after starting analysis."""

    session_id: str = Field(..., description="Unique session identifier")
    status: str = Field(..., description="Current analysis status")
    stream_url: str = Field(..., description="SSE stream URL for real-time updates")


class OriginalSource(BaseModel):
    """Original source information for a claim."""

    url: str = Field(..., description="URL of the original source")
    title: str = Field(..., description="Title of the source")
    publisher: str = Field(..., description="Publisher or author")
    date: str = Field(..., description="Publication date")
    relevant_quote: str = Field(..., description="Relevant quote from the source")


class Verification(BaseModel):
    """Verification result for a source."""

    status: Literal["verified", "distorted", "missing_context", "unverified"] = Field(
        ..., description="Verification status"
    )
    explanation: str = Field(..., description="Explanation of the verification result")
    comparison: str = Field(..., description="Comparison between claim and original")


class Claim(BaseModel):
    """A claim extracted from the content."""

    id: int = Field(..., description="Unique claim identifier")
    text: str = Field(..., description="The claim text")
    evidence: str = Field(..., description="Evidence supporting or refuting the claim")
    sources: list[str] = Field(default_factory=list, description="List of source URLs")


class DetectedBias(BaseModel):
    """A detected bias pattern."""

    type: str = Field(..., description="Type of bias (e.g., confirmation, negativity)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1)")
    example: str = Field(..., description="Example from the content")


class VerifiedSource(BaseModel):
    """A verified source with analysis."""

    original_claim: str = Field(..., description="The original claim being verified")
    original_source: OriginalSource = Field(..., description="Original source details")
    verification: Verification = Field(..., description="Verification result")
    trust_score: int = Field(..., ge=0, le=100, description="Trust score (0-100)")


class SourceInfo(BaseModel):
    """Source information for a perspective."""

    url: str = Field(..., description="URL of the source")
    title: str = Field(..., description="Title of the article/source")
    publisher: str = Field(..., description="Publisher name")


class SpectrumPosition(BaseModel):
    """Position on various spectrums."""

    political: float = Field(..., ge=-1.0, le=1.0, description="Political spectrum (-1 to 1)")
    emotional: float = Field(..., ge=-1.0, le=1.0, description="Emotional spectrum (-1 to 1)")
    complexity: float = Field(..., ge=-1.0, le=1.0, description="Complexity spectrum (-1 to 1)")


class Perspective(BaseModel):
    """A perspective on the analyzed content."""

    id: int = Field(..., description="Unique perspective identifier")
    source: SourceInfo = Field(..., description="Source information")
    main_claim: str = Field(..., description="Main claim of this perspective")
    frame: str = Field(..., description="Framing approach used")
    key_points: list[str] = Field(default_factory=list, description="Key points")
    spectrum: SpectrumPosition = Field(..., description="Position on various spectrums")


class DivergencePoint(BaseModel):
    """A point where perspectives diverge."""

    topic: str = Field(..., description="Topic of divergence")
    positions: list[str] = Field(default_factory=list, description="Different positions")


class AnalysisResult(BaseModel):
    """Complete analysis result."""

    session_id: str = Field(..., description="Session identifier")
    status: Literal["analyzing", "done", "error"] = Field(
        ..., description="Analysis status"
    )
    claims: list[Claim] = Field(default_factory=list, description="Extracted claims")
    detected_biases: list[DetectedBias] = Field(
        default_factory=list, description="Detected bias patterns"
    )
    verified_sources: list[VerifiedSource] = Field(
        default_factory=list, description="Verified sources"
    )
    overall_trust_score: int = Field(
        default=0, ge=0, le=100, description="Overall trust score (0-100)"
    )
    perspectives: list[Perspective] = Field(
        default_factory=list, description="Different perspectives"
    )
    common_facts: list[str] = Field(
        default_factory=list, description="Facts common across perspectives"
    )
    divergence_points: list[DivergencePoint] = Field(
        default_factory=list, description="Points where perspectives diverge"
    )
