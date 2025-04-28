from pydantic import BaseModel

class ProcessRequest(BaseModel):
    query: str 