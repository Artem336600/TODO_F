from typing import List
from pydantic import BaseModel

class ProcessResponse(BaseModel):
    results: List[str] 