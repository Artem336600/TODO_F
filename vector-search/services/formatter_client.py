import httpx
from typing import List

async def format_candidates(candidates: List[str]) -> List[str]:
    """
    Отправляет кандидатов в output-formatter сервис для форматирования.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post("http://output-formatter:8003/api/v1/format", json={"candidates": candidates})
    return response.json()["formatted_candidates"] 