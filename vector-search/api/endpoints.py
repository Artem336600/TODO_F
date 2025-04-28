from fastapi import APIRouter
from schemas.request import VectorRequest
from schemas.response import VectorResponse
from services.faiss_client import search_by_vector
from services.formatter_client import format_candidates

router = APIRouter()

@router.post("/api/v1/search", response_model=VectorResponse)
async def search_vectors(request: VectorRequest):
    candidates = await search_by_vector(request.vector_query)
    formatted_results = await format_candidates(candidates)
    return VectorResponse(candidates=formatted_results) 