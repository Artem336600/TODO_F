# Vector Search - Микросервис векторного поиска

## Описание
Vector Search - микросервис, отвечающий за поиск релевантных кандидатов по векторному представлению запроса. Получает векторы от LLM Processor, выполняет поиск ближайших соседей с помощью FAISS и отправляет найденных кандидатов в Output Formatter.

## Функциональные требования

1. **Получение векторных запросов**
   - Принимать HTTP POST запросы на эндпоинт `/api/v1/search`
   - Валидировать запросы с помощью Pydantic схемы
   - Запрос должен иметь формат: `{"vector_query": [0.1, 0.2, 0.3, ...]}`

2. **Векторный поиск**
   - Выполнять поиск ближайших соседей по входному вектору
   - В MVP используется мок, возвращающий фиксированных кандидатов ["user1", "user2"]
   - В продакшене необходимо использовать реальный FAISS индекс

3. **Форматирование результатов**
   - Отправлять найденных кандидатов в сервис output-formatter
   - Получать форматированные результаты
   - Возвращать результаты в LLM Processor

## Техническая спецификация

### Структура проекта
- **main.py** - Точка входа в приложение FastAPI
- **api/endpoints.py** - Определение эндпоинтов API
- **schemas/request.py** - Pydantic схема запроса
- **schemas/response.py** - Pydantic схема ответа
- **services/faiss_client.py** - Клиент для взаимодействия с FAISS индексом
- **services/formatter_client.py** - Клиент для взаимодействия с Output Formatter

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
    title="Строка API - Vector Search",
    description="Сервис векторного поиска для системы Строка",
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
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

**Входные данные**: Нет прямых входных данных. Файл импортирует внешние модули и настраивает приложение.

**Выходные данные**: Запущенное FastAPI приложение на порту 8002.

#### api/endpoints.py
**Назначение**: Определение API эндпоинтов для обработки запросов.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from fastapi import APIRouter, HTTPException
from schemas.request import VectorRequest
from schemas.response import VectorResponse
from services.faiss_client import search_by_vector
from services.formatter_client import format_candidates
import logging
```

2. Создать роутер:
```python
router = APIRouter(prefix="/api/v1")
```

3. Определить POST эндпоинт `/search`:
```python
@router.post("/search", response_model=VectorResponse)
async def search_vectors(request: VectorRequest):
    try:
        # Поиск кандидатов по вектору
        logging.info(f"Получен вектор для поиска: {request.vector_query}")
        candidates = await search_by_vector(request.vector_query)
        logging.info(f"Найдены кандидаты: {candidates}")
        
        # Форматирование кандидатов
        formatted_results = await format_candidates(candidates)
        logging.info(f"Отформатированные результаты: {formatted_results}")
        
        return VectorResponse(candidates=formatted_results)
    except Exception as e:
        logging.error(f"Ошибка обработки запроса: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка обработки запроса: {str(e)}")
```

**Входные данные**: HTTP запрос с телом в формате JSON, соответствующим схеме VectorRequest:
```json
{
  "vector_query": [0.1, 0.2, 0.3]
}
```

**Выходные данные**: HTTP ответ с телом в формате JSON, соответствующим схеме VectorResponse:
```json
{
  "candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### schemas/request.py
**Назначение**: Определение схемы запроса для валидации данных.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List
from pydantic import BaseModel, Field, conlist
```

2. Определить модель запроса:
```python
class VectorRequest(BaseModel):
    vector_query: List[float] = Field(..., 
                                     description="Векторное представление запроса")
    
    class Config:
        schema_extra = {
            "example": {
                "vector_query": [0.1, 0.2, 0.3]
            }
        }
```

**Входные данные**: JSON объект с полем `vector_query`, содержащим список float-значений.

**Выходные данные**: Валидированный объект Pydantic с полем `vector_query`.

**Пример входных данных**:
```json
{
  "vector_query": [0.1, 0.2, 0.3]
}
```

#### schemas/response.py
**Назначение**: Определение схемы ответа на запрос.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List
from pydantic import BaseModel, Field
```

2. Определить модель ответа:
```python
class VectorResponse(BaseModel):
    candidates: List[str] = Field(..., description="Список найденных кандидатов")
    
    class Config:
        schema_extra = {
            "example": {
                "candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
            }
        }
```

**Входные данные**: Список строк с результатами форматирования.

**Выходные данные**: JSON объект с полем `candidates`, содержащим список строк.

**Пример выходных данных**:
```json
{
  "candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### services/faiss_client.py
**Назначение**: Клиент для взаимодействия с FAISS индексом для поиска по векторам.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List, Dict, Any
import logging
```

2. Определить мок-функцию поиска по вектору:
```python
async def search_by_vector(vector_query: List[float]) -> List[str]:
    """
    Мок функция поиска по вектору с использованием FAISS.
    В реальном коде здесь был бы запрос к FAISS индексу.
    
    Args:
        vector_query (List[float]): Векторное представление запроса
        
    Returns:
        List[str]: Список найденных кандидатов
    """
    logging.info(f"Поиск по вектору: {vector_query}")
    
    # В MVP просто возвращаем фиксированных кандидатов для демонстрации
    # В реальном коде здесь был бы поиск по FAISS индексу
    return ["user1", "user2"]
```

**Входные данные**: 
- `vector_query` (List[float]): Векторное представление запроса

**Выходные данные**: 
- `List[str]`: Список идентификаторов найденных кандидатов

**Пример входных данных**:
```
[0.1, 0.2, 0.3]
```

**Пример выходных данных**:
```
["user1", "user2"]
```

**Примечание для продакшена**: 
В реальной реализации этот модуль должен взаимодействовать с FAISS индексом:

```python
import faiss
import numpy as np
import pickle
import os
from typing import List, Dict
import logging

# Путь к сохраненному индексу и маппингу
INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "data/faiss_index.bin")
MAPPING_PATH = os.getenv("FAISS_MAPPING_PATH", "data/id_mapping.pkl")

# Загрузка индекса и маппинга при старте сервиса
def load_faiss_resources():
    """
    Загружает FAISS индекс и маппинг ID из файлов.
    """
    try:
        # Проверяем, существуют ли файлы
        if not os.path.exists(INDEX_PATH) or not os.path.exists(MAPPING_PATH):
            raise FileNotFoundError(f"Файлы индекса или маппинга не найдены: {INDEX_PATH}, {MAPPING_PATH}")
        
        # Загружаем FAISS индекс
        index = faiss.read_index(INDEX_PATH)
        
        # Загружаем маппинг ID
        with open(MAPPING_PATH, 'rb') as f:
            id_mapping = pickle.load(f)
        
        logging.info(f"Успешно загружен FAISS индекс с {index.ntotal} векторами и маппинг с {len(id_mapping)} записями")
        
        return index, id_mapping
    
    except Exception as e:
        logging.error(f"Ошибка при загрузке FAISS ресурсов: {str(e)}")
        raise

# Функция для поиска ближайших соседей
async def search_by_vector(vector_query: List[float], top_k: int = 5) -> List[str]:
    """
    Выполняет поиск ближайших соседей в FAISS индексе.
    
    Args:
        vector_query (List[float]): Векторное представление запроса
        top_k (int): Количество ближайших соседей для возврата
        
    Returns:
        List[str]: Список идентификаторов найденных кандидатов
    """
    try:
        # Конвертируем входной вектор в numpy массив
        query_vector = np.array(vector_query, dtype=np.float32).reshape(1, -1)
        
        # Загружаем индекс и маппинг
        index, id_mapping = load_faiss_resources()
        
        # Выполняем поиск
        distances, indices = index.search(query_vector, top_k)
        
        # Преобразуем индексы FAISS в идентификаторы пользователей
        candidate_ids = [id_mapping[int(idx)] for idx in indices[0] if idx >= 0]
        
        logging.info(f"Найдено {len(candidate_ids)} кандидатов для вектора")
        
        return candidate_ids
        
    except Exception as e:
        logging.error(f"Ошибка при поиске по вектору: {str(e)}")
        # В случае ошибки можно вернуть пустой список или выбросить исключение
        raise Exception(f"Ошибка при поиске по вектору: {str(e)}")

#### services/formatter_client.py
**Назначение**: Клиент для взаимодействия с Output Formatter сервисом.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
import httpx
from typing import List
import logging
from httpx import TimeoutException, ConnectError
import asyncio
```

2. Определить настройки:
```python
FORMATTER_URL = "http://output-formatter:8003/api/v1/format"
TIMEOUT = 10.0  # секунды
MAX_RETRIES = 3
```

3. Реализовать функцию для отправки запроса:
```python
async def format_candidates(candidates: List[str]) -> List[str]:
    """
    Отправляет кандидатов в Output Formatter сервис для форматирования.
    
    Args:
        candidates (List[str]): Список идентификаторов кандидатов
        
    Returns:
        List[str]: Список форматированных результатов
        
    Raises:
        Exception: При ошибке обработки запроса
    """
    logging.info(f"Отправка кандидатов в Output Formatter: {candidates}")
    
    request_data = {"candidates": candidates}
    retry_count = 0
    
    while retry_count < MAX_RETRIES:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.post(FORMATTER_URL, json=request_data)
                
                if response.status_code == 200:
                    formatted_candidates = response.json()["formatted_candidates"]
                    logging.info(f"Получен ответ от Output Formatter: {formatted_candidates}")
                    return formatted_candidates
                else:
                    error_msg = f"Ошибка запроса к Output Formatter: {response.status_code}, {response.text}"
                    logging.error(error_msg)
                    raise Exception(error_msg)
                    
        except (TimeoutException, ConnectError) as e:
            retry_count += 1
            if retry_count == MAX_RETRIES:
                raise Exception(f"Не удалось подключиться к Output Formatter после {MAX_RETRIES} попыток: {str(e)}")
            
            # Экспоненциальная задержка перед повторной попыткой
            await asyncio.sleep(2 ** retry_count)
        
        except Exception as e:
            raise Exception(f"Ошибка при обработке запроса: {str(e)}")
```

**Входные данные**: 
- `candidates` (List[str]): Список идентификаторов кандидатов

**Выходные данные**: 
- `List[str]`: Список форматированных результатов

**Пример входных данных**:
```
["user1", "user2"]
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

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
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

## Интеграция с реальным FAISS индексом

Для продакшен-версии необходимо реализовать реальную интеграцию с FAISS:

1. **Настройка FAISS индекса**
   - Выбор подходящего типа индекса (плоский, HNSW, IVF)
   - Настройка параметров индекса (метрика расстояния, размерность векторов)
   - Оптимизация под имеющееся оборудование (CPU/GPU)

2. **Управление данными**
   - Загрузка индекса в память при старте сервиса
   - Периодическое обновление индекса
   - Механизм версионирования индексов

3. **Масштабирование**
   - Шардирование индексов для больших объемов данных
   - Кеширование частых запросов
   - Горизонтальное масштабирование сервиса

## Примеры запросов

### Запрос
```bash
curl -X POST "http://localhost:8002/api/v1/search" -H "Content-Type: application/json" -d '{"vector_query": [0.1, 0.2, 0.3]}'
```

### Ответ
```json
{
  "candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

## Тестирование
Для тестирования микросервиса необходимо написать:
1. Юнит-тесты для векторного поиска и клиентов
2. Интеграционные тесты для проверки взаимодействия с Output Formatter
3. Бенчмарки для оценки скорости поиска при разных размерах индекса

## Для нейросетей

Ниже представлены инструкции для генерации кода всего микросервиса Vector Search с помощью нейросети:

```
Сгенерируй код для микросервиса Vector Search системы "Строка". Этот микросервис принимает векторные представления запросов от LLM Processor, выполняет поиск кандидатов (для MVP используется мок, в продакшене - FAISS), и отправляет найденных кандидатов в Output Formatter для форматирования.

Структура микросервиса:

1. main.py - Входная точка FastAPI приложения
- Должен создать экземпляр FastAPI с заголовком "Строка API - Vector Search"
- Подключить роутер из api/endpoints.py
- Настроить CORS middleware для всех источников
- Запустить uvicorn сервер на порту 8002

2. api/endpoints.py - Эндпоинты API
- Создать роутер FastAPI с префиксом "/api/v1"
- Определить POST эндпоинт "/search", который:
  - Принимает JSON с полем "vector_query" (список float)
  - Вызывает функцию search_by_vector из services/faiss_client.py
  - Вызывает функцию format_candidates из services/formatter_client.py
  - Возвращает результаты в формате {"candidates": [список строк]}
- Добавить обработку ошибок и логирование

3. schemas/request.py - Схема запроса
- Определить Pydantic модель VectorRequest с полем vector_query (список float)
- Добавить пример в схему с вектором [0.1, 0.2, 0.3]

4. schemas/response.py - Схема ответа
- Определить Pydantic модель VectorResponse с полем candidates (список строк)
- Добавить пример в схему

5. services/faiss_client.py - Мок клиента для FAISS
- Асинхронная функция search_by_vector, которая:
  - Принимает вектор запроса (список float)
  - Логирует процесс поиска
  - Возвращает фиксированных кандидатов ["user1", "user2"]

6. services/formatter_client.py - Клиент для Output Formatter
- Асинхронная функция format_candidates, которая:
  - Принимает список идентификаторов кандидатов (список строк)
  - Отправляет POST запрос на http://output-formatter:8003/api/v1/format
  - Передает {"candidates": список_кандидатов}
  - Использует httpx для HTTP запросов
  - Имеет механизм повторных попыток (максимум 3)
  - Обрабатывает ошибки соединения и таймауты
  - Возвращает список форматированных кандидатов из response.json()["formatted_candidates"]

Все модули должны использовать асинхронный подход, правильно обрабатывать ошибки, и включать документацию (docstrings).
```

При вставке этого текста в нейросеть, она должна сгенерировать полный код для всех файлов микросервиса Vector Search. 