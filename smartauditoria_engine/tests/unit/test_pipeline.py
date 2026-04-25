"""
Unit tests — Pipeline RAG (sin ChromaDB real, usando mocks).
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.core.pipeline.augmenter import Augmenter, AugmentedContext
from app.core.pipeline.generator import JustificationBuilder, SuggestionGenerator
from app.core.pipeline.retriever import Retriever
from app.domain.risk_context import AssetContext, AssetType, RiskContext


# ── Fixtures ──────────────────────────────────────────────

@pytest.fixture
def sample_context() -> RiskContext:
    return RiskContext(
        activo=AssetContext(
            nombre="Servidor Web Principal",
            tipo=AssetType.SERVIDOR,
            criticidad="Alto",
        ),
        amenaza_id="T.3",
        amenaza_nombre="Acceso No Autorizado",
        vulnerabilidad_id="V.5",
        controles_seleccionados=["A.9.1", "A.9.2"],
        riesgo_inherente=20.0,
        riesgo_residual=8.0,
        industria="Sector público",
    )


@pytest.fixture
def sample_docs() -> list[dict]:
    return [
        {
            "id": "iso27005_8.3",
            "text": "ISO 27005:2022 §8.3 — Identificación de amenazas basada en activos críticos",
            "metadata": {"norma": "ISO 27005:2022", "seccion": "8.3"},
            "score": 0.91,
        },
        {
            "id": "iso27002_A9",
            "text": "ISO 27002 A.9 — Control de acceso: principio de mínimo privilegio",
            "metadata": {"norma": "ISO 27002:2022", "seccion": "A.9"},
            "score": 0.88,
        },
    ]


# ── Tests: Retriever ──────────────────────────────────────

def test_retriever_builds_threat_query(sample_context: RiskContext) -> None:
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = []
    retriever = Retriever(mock_store)
    retriever.retrieve_for_threats(sample_context)
    mock_store.similarity_search.assert_called_once()
    call_args = mock_store.similarity_search.call_args[0][0]
    assert "servidor" in call_args


def test_retriever_filters_by_min_score(sample_context: RiskContext) -> None:
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = [
        {"id": "1", "text": "doc alto score", "metadata": {}, "score": 0.9},
        {"id": "2", "text": "doc bajo score", "metadata": {}, "score": 0.1},
    ]
    retriever = Retriever(mock_store)
    results = retriever.retrieve_for_threats(sample_context)
    # Solo el doc con score >= min_score (0.5 por defecto)
    assert all(r["score"] >= 0.5 for r in results)


# ── Tests: Augmenter ──────────────────────────────────────

def test_augmenter_extracts_iso_references(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    assert len(aug.iso_references) > 0
    assert any("ISO" in ref for ref in aug.iso_references)


def test_augmenter_confidence_increases_with_docs(sample_context: RiskContext) -> None:
    aug_empty = Augmenter().augment(sample_context, [])
    aug_with = Augmenter().augment(sample_context, [
        {"id": "x", "text": "texto", "metadata": {"norma": "ISO"}, "score": 0.9}
    ])
    assert aug_with.confidence_base > aug_empty.confidence_base


def test_augmenter_includes_selected_controls(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    iso_refs_str = " ".join(aug.iso_references)
    assert "A.9" in iso_refs_str


# ── Tests: SuggestionGenerator ────────────────────────────

def test_generator_threats_for_servidor(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    gen = SuggestionGenerator()
    suggestions = gen.generate_threat_suggestions(aug)
    assert len(suggestions) > 0
    # Servidor debe tener amenaza T.1 (Malware)
    ids = [s.id for s in suggestions]
    assert "T.1" in ids or "T.3" in ids


def test_generator_confidence_in_valid_range(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    gen = SuggestionGenerator()
    for suggestion in gen.generate_threat_suggestions(aug):
        assert 0.0 <= suggestion.confianza <= 1.0


# ── Tests: JustificationBuilder ───────────────────────────

def test_justification_builder_produces_all_sections(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    just = JustificationBuilder().build(aug)
    assert just.contexto
    assert just.base_normativa
    assert just.implementacion
    assert just.beneficios_esperados
    assert just.recomendacion


def test_justification_confidence_with_good_docs(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    just = JustificationBuilder().build(aug)
    assert just.nivel_confianza >= 0.65


def test_justification_cites_controls(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    just = JustificationBuilder().build(aug)
    assert len(just.articulos_iso_citados) > 0


def test_justification_markdown_export(
    sample_context: RiskContext, sample_docs: list[dict]
) -> None:
    aug = Augmenter().augment(sample_context, sample_docs)
    just = JustificationBuilder().build(aug)
    md = just.to_markdown()
    assert "## Justificación" in md
    assert "### Contexto" in md
