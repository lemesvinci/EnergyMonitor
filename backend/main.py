# main.py
from fastapi import FastAPI, Depends, Form, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import models
import database

app = FastAPI(title="EnergyMonitor API")

# === API SIMPLES: CRUD ===


@app.post("/api/v1/devices/", response_model=models.Device)
def create_device(
    nome: str=Form(...),
    potencia: float=Form(...),
    horas_uso_diario: float=Form(...),
    custo_por_kwh: float=Form(0.80),
    db: Session=Depends(database.get_db)
):
    device = database.DeviceDB(nome=nome, potencia=potencia, horas_uso_diario=horas_uso_diario, custo_por_kwh=custo_por_kwh)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@app.get("/api/v1/devices/", response_model=List[models.Device])
def list_devices(search: str="", db: Session=Depends(database.get_db)):
    query = db.query(database.DeviceDB)
    if search:
        query = query.filter(database.DeviceDB.nome.ilike(f"%{search}%"))
    return query.all()


@app.put("/api/v1/devices/{id}", response_model=models.Device)
def update_device(
    id: int,
    nome: str=Form(...),
    potencia: float=Form(...),
    horas_uso_diario: float=Form(...),
    custo_por_kwh: float=Form(...),
    db: Session=Depends(database.get_db)
):
    device = db.query(database.DeviceDB).filter(database.DeviceDB.id == id).first()
    if not device:
        raise HTTPException(404, "Dispositivo não encontrado")
    device.nome = nome
    device.potencia = potencia
    device.horas_uso_diario = horas_uso_diario
    device.custo_por_kwh = custo_por_kwh
    db.commit()
    db.refresh(device)
    return device


@app.delete("/api/v1/devices/{id}")
def delete_device(id: int, db: Session=Depends(database.get_db)):
    device = db.query(database.DeviceDB).filter(database.DeviceDB.id == id).first()
    if device:
        db.delete(device)
        db.commit()
    return {"mensagem": "Dispositivo removido"}


# === API COMPLEXA: RELATÓRIO ===
@app.get("/api/v1/report")
def get_report(db: Session=Depends(database.get_db)):
    devices = db.query(database.DeviceDB).all()
    total_kwh = sum((d.potencia / 1000) * d.horas_uso_diario * 30 for d in devices)
    detalhes = []
    for d in devices:
        consumo = (d.potencia / 1000) * d.horas_uso_diario * 30
        custo = consumo * d.custo_por_kwh
        detalhes.append({
            "id": d.id,
            "nome": d.nome,
            "consumo_mensal_kwh": round(consumo, 2),
            "custo_mensal": round(custo, 2),
            "porcentagem": round((consumo / total_kwh) * 100, 1) if total_kwh > 0 else 0
        })
    return {
        "total_dispositivos": len(devices),
        "consumo_total_kwh": round(total_kwh, 2),
        "custo_total_real": round(total_kwh * (devices[0].custo_por_kwh if devices else 0.8), 2),
        "media_diaria_kwh": round(total_kwh / 30, 2) if total_kwh else 0,
        "dispositivos": detalhes
    }
