FROM python:3.12-slim

WORKDIR /app

# 의존성 먼저 복사하여 캐시 활용
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# backend 소스를 /app/backend 로 복사 (패키지로 인식)
COPY . ./backend

# 패키지로 인식되도록 __init__.py 생성
RUN touch backend/__init__.py

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
