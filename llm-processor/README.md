# LLM Processor - Микросервис обработки языковой модели

## Описание
LLM Processor - микросервис, отвечающий за преобразование текстовых запросов в векторные представления с помощью языковой модели DeepSeek. Получает запросы от Input Gateway, преобразует их в эмбеддинги и отправляет в Vector Search.

## Функциональные требования

1. **Получение запросов от Input Gateway**
   - Принимать HTTP POST запросы на эндпоинт `/api/v1/process`
   - Валидировать запросы с помощью Pydantic схемы
   - Запрос должен иметь формат: `{"query": "текст запроса пользователя"}`

2. **Векторизация запросов**
   - Преобразовывать текстовые запросы в векторные представления с помощью DeepSeek
   - В MVP используется мок, возвращающий фиксированный вектор [0.1, 0.2, 0.3]
   - В продакшене необходимо использовать реальную модель DeepSeek или аналоги

3. **Отправка векторов в Vector Search**
   - Передавать полученные векторы в сервис vector-search
   - Обрабатывать ошибки соединения и таймауты
   - Получать результаты поиска и возвращать их в Input Gateway

## Техническая спецификация

### Структура проекта
- **main.py** - Точка входа в приложение FastAPI
- **api/endpoints.py** - Определение эндпоинтов API
- **schemas/request.py** - Pydantic схема запроса
- **schemas/response.py** - Pydantic схема ответа
- **services/deepseek_client.py** - Клиент для взаимодействия с моделью DeepSeek
- **services/vector_search_client.py** - Клиент для взаимодействия с Vector Search

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
    title="Строка API - LLM Processor",
    description="Сервис обработки языковой модели для системы Строка",
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
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

**Входные данные**: Нет прямых входных данных. Файл импортирует внешние модули и настраивает приложение.

**Выходные данные**: Запущенное FastAPI приложение на порту 8001.

#### api/endpoints.py
**Назначение**: Определение API эндпоинтов для обработки запросов.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from fastapi import APIRouter, HTTPException
from schemas.request import ProcessRequest
from schemas.response import ProcessResponse
from services.deepseek_client import get_vector_embedding
from services.vector_search_client import search_candidates
import logging
```

2. Создать роутер:
```python
router = APIRouter(prefix="/api/v1")
```

3. Определить POST эндпоинт `/process`:
```python
@router.post("/process", response_model=ProcessResponse)
async def process_request(request: ProcessRequest):
    try:
        # Получение векторного представления запроса
        vector = await get_vector_embedding(request.query)
        logging.info(f"Получен вектор для запроса: {request.query[:50]}...")
        
        # Поиск кандидатов по вектору
        results = await search_candidates(vector)
        logging.info(f"Найдено кандидатов: {len(results)}")
        
        return ProcessResponse(results=results)
    except Exception as e:
        logging.error(f"Ошибка обработки запроса: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка обработки запроса: {str(e)}")
```

**Входные данные**: HTTP запрос с телом в формате JSON, соответствующим схеме ProcessRequest:
```json
{
  "query": "запрос пользователя о чем-то"
}
```

**Выходные данные**: HTTP ответ с телом в формате JSON, соответствующим схеме ProcessResponse:
```json
{
  "results": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### schemas/request.py
**Назначение**: Определение схемы запроса для валидации данных.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from pydantic import BaseModel, Field
```

2. Определить модель запроса:
```python
class ProcessRequest(BaseModel):
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
**Назначение**: Определение схемы ответа на запрос.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List
from pydantic import BaseModel, Field
```

2. Определить модель ответа:
```python
class ProcessResponse(BaseModel):
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

#### services/deepseek_client.py
**Назначение**: Клиент для взаимодействия с моделью DeepSeek для получения векторных представлений.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List, Dict, Any
import logging
```

2. Определить мок-функцию получения вектора:
```python
async def get_vector_embedding(query: str) -> List[float]:
    """
    Мок функция получения векторов из DeepSeek модели.
    В реальном коде здесь был бы запрос к API модели DeepSeek.
    
    Args:
        query (str): Текст запроса пользователя
        
    Returns:
        List[float]: Векторное представление запроса
    """
    logging.info(f"Преобразование запроса в вектор: {query[:50]}...")
    
    # В MVP просто возвращаем фиксированный вектор для демонстрации
    # В реальном коде здесь был бы вызов API DeepSeek
    return [0.1, 0.2, 0.3]
```

**Входные данные**: 
- `query` (str): Текст запроса пользователя

**Выходные данные**: 
- `List[float]`: Векторное представление запроса

**Пример входных данных**:
```
"Найти специалиста по Python"
```

**Пример выходных данных**:
```
[0.1, 0.2, 0.3]
```

**Примечание для продакшена**: 
В реальной реализации эта функция должна взаимодействовать с API DeepSeek или другой языковой моделью:

```python
async def get_vector_embedding(query: str) -> List[float]:
    """
    Получение векторного представления из модели DeepSeek.
    
    Args:
        query (str): Текст запроса пользователя
        
    Returns:
        List[float]: Векторное представление запроса
    """
    try:
        # Инициализация модели DeepSeek для создания эмбеддингов
        # Пример использования библиотеки deepseek-ai:
        from deepseek_ai import DeepSeekEmbeddings
        
        # Создаем экземпляр модели с определенными параметрами
        model = DeepSeekEmbeddings(
            model_name="deepseek-ai/deepseek-coder-6.7b-base",
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            dimensions=1024  # Размерность выходного вектора
        )
        
        # Получаем эмбеддинги
        response = await model.get_embeddings(query)
        
        # Возвращаем векторное представление
        return response.embeddings
        
    except Exception as e:
        logging.error(f"Ошибка при получении векторного представления: {str(e)}")
        # В случае ошибки можно возвращать нулевой вектор или выбрасывать исключение
        raise Exception(f"Не удалось получить векторное представление: {str(e)}")
```

Примечания по интеграции:
1. Необходимо зарегистрироваться и получить API ключ DeepSeek: https://platform.deepseek.ai
2. Установить официальный SDK: `pip install deepseek-ai`
3. Передавать API ключ через переменные окружения для безопасности
4. Кэшировать результаты для частых запросов
5. Настроить повторные попытки при временных сбоях API

Для оптимизации производительности рекомендуется:
1. Настроить пул соединений
2. Реализовать асинхронное API с использованием FastAPI и httpx
3. Добавить таймауты и обработку исключений
4. Реализовать мониторинг времени отклика API

#### services/vector_search_client.py
**Назначение**: Клиент для взаимодействия с Vector Search сервисом.

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
VECTOR_SEARCH_URL = "http://vector-search:8002/api/v1/search"
TIMEOUT = 10.0  # секунды
MAX_RETRIES = 3
```

3. Реализовать функцию для отправки запроса:
```python
async def search_candidates(vector: List[float]) -> List[str]:
    """
    Отправляет вектор запроса в Vector Search сервис и возвращает найденных кандидатов.
    
    Args:
        vector (List[float]): Векторное представление запроса
        
    Returns:
        List[str]: Список найденных кандидатов
        
    Raises:
        Exception: При ошибке обработки запроса
    """
    logging.info(f"Отправка вектора в Vector Search: {vector}")
    
    request_data = {"vector_query": vector}
    retry_count = 0
    
    while retry_count < MAX_RETRIES:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.post(VECTOR_SEARCH_URL, json=request_data)
                
                if response.status_code == 200:
                    candidates = response.json()["candidates"]
                    logging.info(f"Получен ответ от Vector Search: {candidates}")
                    return candidates
                else:
                    error_msg = f"Ошибка запроса к Vector Search: {response.status_code}, {response.text}"
                    logging.error(error_msg)
                    raise Exception(error_msg)
                    
        except (TimeoutException, ConnectError) as e:
            retry_count += 1
            if retry_count == MAX_RETRIES:
                raise Exception(f"Не удалось подключиться к Vector Search после {MAX_RETRIES} попыток: {str(e)}")
            
            # Экспоненциальная задержка перед повторной попыткой
            await asyncio.sleep(2 ** retry_count)
        
        except Exception as e:
            raise Exception(f"Ошибка при обработке запроса: {str(e)}")
```

**Входные данные**: 
- `vector` (List[float]): Векторное представление запроса

**Выходные данные**: 
- `List[str]`: Список найденных кандидатов

**Пример входных данных**:
```
[0.1, 0.2, 0.3]
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

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
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

## Интеграция с реальной моделью DeepSeek

Для продакшен-версии необходимо реализовать реальную интеграцию с моделью DeepSeek:

1. **Настройка DeepSeek API клиента**
   - Получение API ключа и настройка авторизации
   - Конфигурация эндпоинтов модели
   - Максимальная длина запроса и другие ограничения

2. **Оптимизация производительности**
   - Кеширование результатов векторизации
   - Батчинг запросов к модели
   - Асинхронная обработка запросов

3. **Обработка ошибок**
   - Ретраи при сбоях API
   - Fallback на альтернативные модели
   - Логирование ошибок

## Примеры запросов

### Запрос
```bash
curl -X POST "http://localhost:8001/api/v1/process" -H "Content-Type: application/json" -d '{"query": "тестовый запрос"}'
```

### Ответ
```json
{
  "results": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

## Тестирование
Для тестирования микросервиса необходимо написать:
1. Юнит-тесты для векторизации запросов и клиентов
2. Интеграционные тесты для проверки взаимодействия с Vector Search
3. Нагрузочные тесты для оценки производительности и масштабируемости

## Для нейросетей

Ниже представлены инструкции для генерации кода всего микросервиса LLM Processor с помощью нейросети:

```
Сгенерируй код для микросервиса LLM Processor системы "Строка". Этот микросервис принимает текстовые запросы от Input Gateway, преобразует их в векторные представления с помощью модели DeepSeek (для MVP используется мок), и отправляет векторы в Vector Search.

Структура микросервиса:

1. main.py - Входная точка FastAPI приложения
- Должен создать экземпляр FastAPI с заголовком "Строка API - LLM Processor"
- Подключить роутер из api/endpoints.py
- Настроить CORS middleware для всех источников
- Запустить uvicorn сервер на порту 8001

2. api/endpoints.py - Эндпоинты API
- Создать роутер FastAPI с префиксом "/api/v1"
- Определить POST эндпоинт "/process", который:
  - Принимает JSON с полем "query"
  - Вызывает функцию get_vector_embedding из services/deepseek_client.py
  - Вызывает функцию search_candidates из services/vector_search_client.py
  - Возвращает результаты в формате {"results": [список строк]}
- Добавить обработку ошибок и логирование

3. schemas/request.py - Схема запроса
- Определить Pydantic модель ProcessRequest с полем query (строка)
- Добавить валидацию: мин. длина 1, макс. длина 1000 символов
- Добавить пример в схему

4. schemas/response.py - Схема ответа
- Определить Pydantic модель ProcessResponse с полем results (список строк)
- Добавить пример в схему

5. services/deepseek_client.py - Мок клиента для DeepSeek
- Асинхронная функция get_vector_embedding, которая:
  - Принимает текст запроса (query)
  - Логирует процесс преобразования
  - Возвращает фиксированный вектор [0.1, 0.2, 0.3]

6. services/vector_search_client.py - Клиент для Vector Search
- Асинхронная функция search_candidates, которая:
  - Принимает вектор (список float чисел)
  - Отправляет POST запрос на http://vector-search:8002/api/v1/search
  - Передает {"vector_query": вектор}
  - Использует httpx для HTTP запросов
  - Имеет механизм повторных попыток (максимум 3)
  - Обрабатывает ошибки соединения и таймауты
  - Возвращает список кандидатов из response.json()["candidates"]

Все модули должны использовать асинхронный подход, правильно обрабатывать ошибки, и включать документацию (docstrings).
```

При вставке этого текста в нейросеть, она должна сгенерировать полный код для всех файлов микросервиса LLM Processor. 