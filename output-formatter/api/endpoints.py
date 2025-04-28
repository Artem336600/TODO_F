from fastapi import APIRouter
from schemas.request import FormatRequest
from schemas.response import FormatResponse
from services.db_client import get_formatted_info

router = APIRouter()

@router.post("/api/v1/format", response_model=FormatResponse)
async def format_candidates(request: FormatRequest):
    formatted_candidates = await get_formatted_info(request.candidates)
    return FormatResponse(formatted_candidates=formatted_candidates) 