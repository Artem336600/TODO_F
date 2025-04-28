from typing import List
from pydantic import BaseModel

class UserResponse(BaseModel):
    results: List[str] 