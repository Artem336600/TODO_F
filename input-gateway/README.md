# Input Gateway - Микросервис входной точки

## Описание
Input Gateway - это входная точка для всей системы "Строка". Микросервис принимает запросы от пользователей, перенаправляет их в сервис обработки языковой модели (LLM Processor) и возвращает результаты пользователю.

## Функциональные требования

1. **Прием запросов от пользователей**
   - Принимать HTTP POST запросы на эндпоинт `/process`
   - Валидировать запросы с помощью Pydantic схемы
   - Запрос должен иметь формат: `{"query": "текст запроса пользователя"}`

2. **Перенаправление в LLM Processor**
   - Передавать текст запроса в сервис llm-processor
   - Обрабатывать ошибки соединения и таймауты
   - Настраивать таймауты и повторные попытки

3. **Возврат результатов**
   - Возвращать отформатированные результаты пользователю
   - Результат должен иметь формат: `{"results": ["результат 1", "результат 2", ...]}`

## Техническая спецификация

### Структура проекта
- **main.py** - Точка входа в приложение FastAPI
- **api/endpoints.py** - Определение эндпоинтов API
- **schemas/request.py** - Pydantic схема запроса
- **schemas/response.py** - Pydantic схема ответа
- **services/llm_client.py** - Клиент для взаимодействия с LLM Processor

### Детальное ТЗ по файлам

#### main.py
**Назначение**: Входная точка приложения FastAPI, настройка и запуск сервера.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from fastapi import FastAPI
from api import endpoints
```

2. Создать экземпляр FastAPI:
```python
app = FastAPI(
    title="Строка API - Input Gateway",
    description="Входная точка для системы Строка",
    version="0.1.0"
)
```

3. Подключить роутер из endpoints.py:
```python
app.include_router(endpoints.router)
```

4. Добавить CORS middleware и логирование (опционально для MVP):
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

5. Добавить запуск сервера:
```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Входные данные**: Нет прямых входных данных. Файл импортирует внешние модули и настраивает приложение.

**Выходные данные**: Запущенное FastAPI приложение на порту 8000.

#### api/endpoints.py
**Назначение**: Определение API эндпоинтов для обработки запросов.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from fastapi import APIRouter, HTTPException
from schemas.request import UserRequest
from schemas.response import UserResponse
from services.llm_client import process_query
```

2. Создать роутер:
```python
router = APIRouter()
```

3. Определить POST эндпоинт `/process`:
```python
@router.post("/process", response_model=UserResponse)
async def process_user_query(request: UserRequest):
    try:
        results = await process_query(request.query)
        return UserResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки запроса: {str(e)}")
```

**Входные данные**: HTTP запрос с телом в формате JSON, соответствующим схеме UserRequest:
```json
{
  "query": "запрос пользователя о чем-то"
}
```

**Выходные данные**: HTTP ответ с телом в формате JSON, соответствующим схеме UserResponse:
```json
{
  "results": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### schemas/request.py
**Назначение**: Определение схемы запроса пользователя для валидации данных.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from pydantic import BaseModel, Field
```

2. Определить модель запроса:
```python
class UserRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, 
                       description="Текст запроса пользователя")
    
    class Config:
        schema_extra = {
            "example": {
                "query": "Найти специалиста по Python"
            }
        }
```

**Входные данные**: JSON объект с полем `query`.

**Выходные данные**: Валидированный объект Pydantic с полем `query`.

**Пример входных данных**:
```json
{
  "query": "Найти специалиста по Python"
}
```

#### schemas/response.py
**Назначение**: Определение схемы ответа на запрос пользователя.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List
from pydantic import BaseModel, Field
```

2. Определить модель ответа:
```python
class UserResponse(BaseModel):
    results: List[str] = Field(..., description="Список результатов поиска")
    
    class Config:
        schema_extra = {
            "example": {
                "results": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
            }
        }
```

**Входные данные**: Список строк с результатами.

**Выходные данные**: JSON объект с полем `results`, содержащим список строк.

**Пример выходных данных**:
```json
{
  "results": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### services/llm_client.py
**Назначение**: Клиент для взаимодействия с LLM Processor сервисом.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
import httpx
from typing import List
import logging
from httpx import TimeoutException, ConnectError
```

2. Определить настройки:
```python
LLM_PROCESSOR_URL = "http://llm-processor:8001/api/v1/process"
TIMEOUT = 10.0  # секунды
MAX_RETRIES = 3
```

3. Реализовать функцию для отправки запроса:
```python
async def process_query(query: str) -> List[str]:
    """
    Отправляет запрос в LLM Processor и возвращает результаты.
    
    Args:
        query (str): Текст запроса пользователя
        
    Returns:
        List[str]: Список результатов
        
    Raises:
        Exception: При ошибке обработки запроса
    """
    request_data = {"query": query}
    retry_count = 0
    
    while retry_count < MAX_RETRIES:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.post(LLM_PROCESSOR_URL, json=request_data)
                
                if response.status_code == 200:
                    return response.json()["results"]
                else:
                    error_msg = f"Ошибка запроса к LLM Processor: {response.status_code}, {response.text}"
                    logging.error(error_msg)
                    raise Exception(error_msg)
                    
        except (TimeoutException, ConnectError) as e:
            retry_count += 1
            if retry_count == MAX_RETRIES:
                raise Exception(f"Не удалось подключиться к LLM Processor после {MAX_RETRIES} попыток: {str(e)}")
            
            # Экспоненциальная задержка перед повторной попыткой
            await asyncio.sleep(2 ** retry_count)
        
        except Exception as e:
            raise Exception(f"Ошибка при обработке запроса: {str(e)}")
```

**Входные данные**: 
- `query` (str): Текст запроса пользователя

**Выходные данные**: 
- `List[str]`: Список строк с результатами

**Пример входных данных**:
```
"Найти специалиста по Python"
```

**Пример выходных данных**:
```
["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
```

### Dockerfile
**Назначение**: Инструкции для создания Docker-образа микросервиса.

**Содержимое**:
```dockerfile
FROM python:3.11

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt
**Назначение**: Список зависимостей для установки.

**Содержимое**:
```
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.1
pydantic==2.4.2
```

## Расширение для боевой среды
В текущем MVP взаимодействие с llm-processor реализовано через простой HTTP клиент, но для продакшн-среды рекомендуется:

1. Добавить механизм ретраев с экспоненциальной задержкой
2. Реализовать circuit breaker для защиты от каскадных сбоев
3. Добавить метрики и трассировку для мониторинга
4. Добавить обработку ошибок и логирование
5. Реализовать балансировку нагрузки через service discovery

## Примеры запросов

### Запрос
```bash
curl -X POST "http://localhost:8000/process" -H "Content-Type: application/json" -d '{"query": "тестовый запрос"}'
```

### Ответ
```json
{
  "results": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

## Тестирование
Для тестирования микросервиса необходимо написать:
1. Юнит-тесты для валидации схем и бизнес-логики
2. Интеграционные тесты для проверки взаимодействия с llm-processor
3. E2E тесты для проверки всего flow от запроса до ответа

## Для нейросетей

Ниже представлены инструкции для генерации кода всего микросервиса Input Gateway с помощью нейросети:

```
Сгенерируй код для микросервиса Input Gateway системы "Строка". Микросервис является входной точкой системы, принимает запросы от пользователей и перенаправляет их в LLM Processor.

Структура микросервиса:

1. main.py - Входная точка FastAPI приложения
- Должен создать экземпляр FastAPI с заголовком "Строка API - Input Gateway"
- Подключить роутер из api/endpoints.py
- Настроить CORS middleware для всех источников
- Запустить uvicorn сервер на порту 8000

2. api/endpoints.py - Эндпоинты API
- Создать роутер FastAPI
- Определить POST эндпоинт "/process", который:
  - Принимает JSON с полем "query"
  - Вызывает функцию process_query из services/llm_client.py
  - Возвращает результаты в формате {"results": [список строк]}
- Добавить обработку ошибок с помощью try/except

3. schemas/request.py - Схема запроса
- Определить Pydantic модель UserRequest с полем query (строка)
- Добавить валидацию: мин. длина 1, макс. длина 1000 символов
- Добавить пример в схему

4. schemas/response.py - Схема ответа
- Определить Pydantic модель UserResponse с полем results (список строк)
- Добавить пример в схему

5. services/llm_client.py - Клиент для LLM Processor
- Асинхронная функция process_query, которая:
  - Отправляет POST запрос на http://llm-processor:8001/api/v1/process
  - Передает {"query": текст_запроса}
  - Использует httpx для HTTP запросов
  - Имеет механизм повторных попыток (максимум 3)
  - Обрабатывает ошибки соединения и таймауты
  - Возвращает список строк из response.json()["results"]

Все модули должны использовать асинхронный подход, правильно обрабатывать ошибки, и следовать стандартам Python (PEP 8).
```

При вставке этого текста в нейросеть, она должна сгенерировать полный код для всех файлов микросервиса Input Gateway. 