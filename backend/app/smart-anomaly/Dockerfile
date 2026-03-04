FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /ai-service

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8100

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
