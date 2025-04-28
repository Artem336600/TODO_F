from typing import List
from pydantic import BaseModel

class FormatRequest(BaseModel):
    candidates: List[str] 