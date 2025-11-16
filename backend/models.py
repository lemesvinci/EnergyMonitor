# models.py
from pydantic import BaseModel
from typing import Optional

class Device(BaseModel):
    id: Optional[int] = None
    nome: str
    potencia: float
    horas_uso_diario: float
    custo_por_kwh: float = 0.80