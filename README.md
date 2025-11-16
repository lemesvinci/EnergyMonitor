# EnergyMonitor ⚡

**Sistema de Monitoramento de Consumo Elétrico Residencial**

## Funcionalidades
- Cadastro de dispositivos (potência, uso diário)
- Cálculo automático de kWh e custo mensal
- Dashboard com busca
- Login, cadastro e recuperação de senha
- API Simples (CRUD) + API Complexa (relatório)

## Tecnologias
- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Documentação**: Swagger UI (`/docs`)

## Como Rodar

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Acesse: http://localhost:8000/docs
Frontend
bashcd frontend
npm install
npm run dev
Acesse: http://localhost:5173
API

Simples: /api/v1/devices (CRUD)
Complexa: /api/v1/report (relatório mensal)

Deploy (futuro)

Frontend: Vercel
Backend: Render


Desenvolvido por [Guilherme Lemes Andrade] – 2025