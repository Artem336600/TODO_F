from fastapi import APIRouter
from schemas.request import UserRequest
from schemas.response import UserResponse
from services.llm_client import process_query

router = APIRouter()

@router.post("/process", response_model=UserResponse)
async def process_user_query(request: UserRequest):
    results = await process_query(request.query)
    return UserResponse(results=results) 