import httpx
from typing import List

async def search_candidates(vector: List[float]) -> List[str]:
    """
    Отправляет вектор запроса в vector-search сервис.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post("http://vector-search:8002/api/v1/search", json={"vector_query": vector})
    return response.json()["candidates"] 