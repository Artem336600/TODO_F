from typing import List
from pydantic import BaseModel

class VectorRequest(BaseModel):
    vector_query: List[float] 