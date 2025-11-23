# backend/main.py

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

app = FastAPI(title="EnergyMonitor API", docs_url="/docs", redoc_url="/redoc")

# CORS para o frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Banco de dados
engine = create_engine("sqlite:///energy.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ==================== MODELO SQLALCHEMY ====================
class DeviceDB(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    power_watts = Column(Float)
    hours_per_day = Column(Float)
    quantity = Column(Integer, default=1)
    custo_por_kwh = Column(Float, default=1.13)


Base.metadata.create_all(bind=engine)


# ==================== MODELOS PYDANTIC ====================
class DeviceCreate(BaseModel):
    name: str
    power_watts: float
    hours_per_day: float
    quantity: Optional[int] = 1
    custo_por_kwh: Optional[float] = 1.13


class DeviceResponse(BaseModel):
    id: int
    name: str
    power_watts: float
    hours_per_day: float
    quantity: int
    custo_por_kwh: float

    class Config:
        from_attributes = True


# ==================== DEPENDÊNCIA ====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== ROTAS ====================


# Raiz redireciona pro Swagger
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/docs")


# CRIAR
@app.post("/api/v1/devices/", response_model=DeviceResponse)
def create_device(device: DeviceCreate, db: Session=Depends(get_db)):
    db_device = DeviceDB(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


# LISTAR TODOS
@app.get("/api/v1/devices/", response_model=List[DeviceResponse])
def list_devices(db: Session=Depends(get_db)):
    return db.query(DeviceDB).all()


# BUSCAR POR ID (ESSA ROTA ESTAVA FALTANDO — ERA O ERRO 405!)
@app.get("/api/v1/devices/{id}", response_model=DeviceResponse)
def get_device_by_id(id: int, db: Session=Depends(get_db)):
    device = db.query(DeviceDB).filter(DeviceDB.id == id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    return device


# ATUALIZAR
@app.put("/api/v1/devices/{id}", response_model=DeviceResponse)
def update_device(id: int, device: DeviceCreate, db: Session=Depends(get_db)):
    db_device = db.query(DeviceDB).filter(DeviceDB.id == id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    
    db_device.name = device.name
    db_device.power_watts = device.power_watts
    db_device.hours_per_day = device.hours_per_day
    db_device.quantity = device.quantity or 1
    db_device.custo_por_kwh = device.custo_por_kwh or 1.13
    
    db.commit()
    db.refresh(db_device)
    return db_device


# DELETAR
@app.delete("/api/v1/devices/{id}")
def delete_device(id: int, db: Session=Depends(get_db)):
    device = db.query(DeviceDB).filter(DeviceDB.id == id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    db.delete(device)
    db.commit()
    return {"message": "Dispositivo removido com sucesso"}


# RELATÓRIO AVANÇADO
@app.get("/api/v1/report/advanced")
def advanced_report(db: Session=Depends(get_db)):
    devices = db.query(DeviceDB).all()
    
    if not devices:
        return {
            "current_kwh": 0,
            "current_cost": 0,
            "forecast_kwh": 0,
            "forecast_cost": 0,
            "top_device": "Nenhum",
            "suggestions": []
        }

    current_kwh = sum((d.power_watts / 1000) * d.hours_per_day * 30 * d.quantity for d in devices)
    current_cost = current_kwh * 1.13
    forecast_kwh = current_kwh * 1.10
    forecast_cost = forecast_kwh * 1.13

    top_device = max(devices, key=lambda d: d.power_watts * d.hours_per_day * d.quantity)

    suggestions = []
    for d in devices:
        if d.hours_per_day > 6:
            economia = (d.power_watts / 1000) * 2 * 30 * d.quantity * 1.13
            suggestions.append(f"Reduza {d.name} em 2h/dia → economiza R$ {economia:.2f}")

    return {
        "current_kwh": round(current_kwh, 2),
        "current_cost": round(current_cost, 2),
        "forecast_kwh": round(forecast_kwh, 2),
        "forecast_cost": round(forecast_cost, 2),
        "top_device": top_device.name,
        "suggestions": suggestions[:4]
    }