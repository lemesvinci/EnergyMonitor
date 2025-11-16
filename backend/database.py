# database.py
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./energy.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class DeviceDB(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    potencia = Column(Float)
    horas_uso_diario = Column(Float)
    custo_por_kwh = Column(Float, default=0.80)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()