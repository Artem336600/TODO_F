from fastapi import APIRouter
from schemas.request import ProcessRequest
from schemas.response import ProcessResponse
from services.deepseek_client import get_vector_embedding
from services.vector_search_client import search_candidates

router = APIRouter()

@router.post("/api/v1/process", response_model=ProcessResponse)
async def process_request(request: ProcessRequest):
    vector = await get_vector_embedding(request.query)
    results = await search_candidates(vector)
    return ProcessResponse(results=results) 