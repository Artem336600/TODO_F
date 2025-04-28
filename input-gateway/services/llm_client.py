import httpx

async def process_query(query: str):
    async with httpx.AsyncClient() as client:
        response = await client.post("http://llm-processor:8001/api/v1/process", json={"query": query})
    return response.json()["results"] 