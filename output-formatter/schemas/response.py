from typing import List
from pydantic import BaseModel

class FormatResponse(BaseModel):
    formatted_candidates: List[str] 