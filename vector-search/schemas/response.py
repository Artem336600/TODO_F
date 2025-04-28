from typing import List
from pydantic import BaseModel

class VectorResponse(BaseModel):
    candidates: List[str] 