# Output Formatter - Микросервис форматирования результатов

## Описание
Output Formatter - микросервис, отвечающий за форматирование результатов поиска. Получает необработанных кандидатов от Vector Search и преобразует их в удобный для пользователя формат, добавляя дополнительные данные и форматирование.

## Функциональные требования

1. **Получение результатов для форматирования**
   - Принимать HTTP POST запросы на эндпоинт `/api/v1/format`
   - Валидировать запросы с помощью Pydantic схемы
   - Запрос должен иметь формат: `{"candidates": ["user1", "user2"]}`

2. **Обогащение данных**
   - Получать дополнительную информацию для каждого кандидата из базы данных
   - Для MVP используется мок с предопределенными данными
   - В продакшене необходимо подключение к реальной базе данных

3. **Форматирование результатов**
   - Объединять базовые данные о кандидатах с дополнительной информацией
   - Форматировать результаты в удобочитаемом виде
   - Возвращать список строк с отформатированными результатами

## Техническая спецификация

### Структура проекта
- **main.py** - Точка входа в приложение FastAPI
- **api/endpoints.py** - Определение эндпоинтов API
- **schemas/request.py** - Pydantic схема запроса
- **schemas/response.py** - Pydantic схема ответа
- **services/data_enricher.py** - Сервис для обогащения данных
- **services/formatter.py** - Сервис для форматирования результатов

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
    title="Строка API - Output Formatter",
    description="Сервис форматирования результатов для системы Строка",
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
    uvicorn.run(app, host="0.0.0.0", port=8003)
```

**Входные данные**: Нет прямых входных данных. Файл импортирует внешние модули и настраивает приложение.

**Выходные данные**: Запущенное FastAPI приложение на порту 8003.

#### api/endpoints.py
**Назначение**: Определение API эндпоинтов для обработки запросов.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from fastapi import APIRouter, HTTPException
from schemas.request import FormatterRequest
from schemas.response import FormatterResponse
from services.data_enricher import enrich_data
from services.formatter import format_data
import logging
```

2. Создать роутер:
```python
router = APIRouter(prefix="/api/v1")
```

3. Определить POST эндпоинт `/format`:
```python
@router.post("/format", response_model=FormatterResponse)
async def format_candidates(request: FormatterRequest):
    try:
        # Логирование входящего запроса
        logging.info(f"Получен запрос на форматирование: {request.candidates}")
        
        # Обогащение данных из базы данных
        enriched_data = await enrich_data(request.candidates)
        logging.info(f"Данные обогащены: {enriched_data}")
        
        # Форматирование результатов
        formatted_results = await format_data(enriched_data)
        logging.info(f"Данные отформатированы: {formatted_results}")
        
        return FormatterResponse(formatted_candidates=formatted_results)
    except Exception as e:
        logging.error(f"Ошибка обработки запроса: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка обработки запроса: {str(e)}")
```

**Входные данные**: HTTP запрос с телом в формате JSON, соответствующим схеме FormatterRequest:
```json
{
  "candidates": ["user1", "user2"]
}
```

**Выходные данные**: HTTP ответ с телом в формате JSON, соответствующим схеме FormatterResponse:
```json
{
  "formatted_candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### schemas/request.py
**Назначение**: Определение схемы запроса для валидации данных.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List
from pydantic import BaseModel, Field
```

2. Определить модель запроса:
```python
class FormatterRequest(BaseModel):
    candidates: List[str] = Field(..., 
                                 description="Список идентификаторов кандидатов для форматирования")
    
    class Config:
        schema_extra = {
            "example": {
                "candidates": ["user1", "user2"]
            }
        }
```

**Входные данные**: JSON объект с полем `candidates`, содержащим список строк с идентификаторами кандидатов.

**Выходные данные**: Валидированный объект Pydantic с полем `candidates`.

**Пример входных данных**:
```json
{
  "candidates": ["user1", "user2"]
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
class FormatterResponse(BaseModel):
    formatted_candidates: List[str] = Field(..., 
                                          description="Список отформатированных результатов")
    
    class Config:
        schema_extra = {
            "example": {
                "formatted_candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
            }
        }
```

**Входные данные**: Список строк с форматированными результатами.

**Выходные данные**: JSON объект с полем `formatted_candidates`, содержащим список строк.

**Пример выходных данных**:
```json
{
  "formatted_candidates": ["Иван Иванов - Разработчик", "Петр Петров - Дизайнер"]
}
```

#### services/data_enricher.py
**Назначение**: Сервис для обогащения данных из базы данных.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List, Dict, Any
import logging
```

2. Определить мок базы данных для MVP:
```python
# Мок базы данных для MVP
mock_db = {
    "user1": {
        "name": "Иван Иванов",
        "title": "Разработчик",
        "skills": ["Python", "FastAPI", "Docker"],
        "experience": "5 лет"
    },
    "user2": {
        "name": "Петр Петров",
        "title": "Дизайнер",
        "skills": ["UI", "UX", "Figma"],
        "experience": "3 года"
    }
}
```

3. Реализовать функцию для обогащения данных:
```python
async def enrich_data(candidate_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Обогащает данные для кандидатов из базы данных.
    В MVP используется мок-база данных.
    В продакшен-версии следует заменить на реальное подключение к БД.
    
    Args:
        candidate_ids (List[str]): Список идентификаторов кандидатов
        
    Returns:
        List[Dict[str, Any]]: Список обогащенных данных о кандидатах
    """
    logging.info(f"Обогащение данных для кандидатов: {candidate_ids}")
    
    enriched_data = []
    
    for candidate_id in candidate_ids:
        if candidate_id in mock_db:
            enriched_data.append(mock_db[candidate_id])
        else:
            # Обработка случая, когда ID нет в базе данных
            logging.warning(f"Кандидат {candidate_id} не найден в базе данных")
            # Возвращаем базовую информацию
            enriched_data.append({
                "name": f"Пользователь {candidate_id}",
                "title": "Нет данных",
                "skills": [],
                "experience": "Нет данных"
            })
    
    return enriched_data
```

**Входные данные**: 
- `candidate_ids` (List[str]): Список идентификаторов кандидатов

**Выходные данные**: 
- `List[Dict[str, Any]]`: Список словарей с обогащенными данными о кандидатах

**Пример входных данных**:
```
["user1", "user2"]
```

**Пример выходных данных**:
```
[
    {
        "id": "user1",
        "name": "Иван Иванов",
        "title": "Разработчик",
        "skills": ["Python", "FastAPI", "Docker"],
        "experience": "5 лет"
    },
    {
        "id": "user2",
        "name": "Петр Петров",
        "title": "Дизайнер",
        "skills": ["UI", "UX", "Figma"],
        "experience": "3 года"
    }
]
```

**Примечание для продакшена**: 
В реальной реализации эта функция должна использовать подключение к базе данных:

```python
import asyncpg

# Конфигурация подключения к базе данных - вынести в конфиг
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "stroka_db"
DB_USER = "stroka_user"
DB_PASSWORD = "password"

async def get_db_pool():
    """Создает пул подключений к базе данных PostgreSQL"""
    return await asyncpg.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

async def enrich_data(candidate_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Обогащает данные для кандидатов из базы данных.
    
    Args:
        candidate_ids (List[str]): Список идентификаторов кандидатов
        
    Returns:
        List[Dict[str, Any]]: Список обогащенных данных о кандидатах
    """
    if not candidate_ids:
        return []
        
    # Получаем пул подключений
    pool = await get_db_pool()
    
    try:
        # Формируем вопросительные знаки для SQL запроса
        placeholders = ",".join(f"${i+1}" for i in range(len(candidate_ids)))
        
        # Выполняем запрос к базе данных
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT 
                    id, 
                    name, 
                    title, 
                    skills, 
                    experience 
                FROM 
                    candidates 
                WHERE 
                    id = ANY($1)
                """,
                candidate_ids
            )
            
            # Преобразуем результаты запроса в список словарей
            result = []
            for row in rows:
                result.append({
                    "id": row["id"],
                    "name": row["name"],
                    "title": row["title"],
                    "skills": row["skills"],
                    "experience": row["experience"]
                })
            
            # Проверяем, все ли кандидаты были найдены
            found_ids = set(r["id"] for r in result)
            missing_ids = set(candidate_ids) - found_ids
            
            # Для ненайденных кандидатов добавляем заглушки
            for missing_id in missing_ids:
                result.append({
                    "id": missing_id,
                    "name": "Неизвестный пользователь",
                    "title": "Нет данных",
                    "error": "Пользователь не найден в базе данных"
                })
            
            return result
            
    finally:
        # Закрываем пул подключений
        await pool.close()
```

#### services/formatter.py
**Назначение**: Сервис для форматирования результатов.

**Что реализовать**:
1. Импортировать необходимые библиотеки:
```python
from typing import List, Dict, Any
import logging
import json
```

2. Реализовать функцию для форматирования данных:
```python
async def format_data(enriched_data: List[Dict[str, Any]]) -> List[str]:
    """
    Форматирует обогащенные данные в удобочитаемый вид.
    
    Args:
        enriched_data (List[Dict[str, Any]]): Список обогащенных данных о кандидатах
        
    Returns:
        List[str]: Список отформатированных строк
    """
    logging.info(f"Форматирование данных для {len(enriched_data)} кандидатов")
    
    formatted_results = []
    
    for user_data in enriched_data:
        # Получаем основные данные
        name = user_data.get("name", "Нет имени")
        title = user_data.get("title", "Нет должности")
        
        # Форматируем навыки
        skills = user_data.get("skills", [])
        skills_str = ", ".join(skills) if skills else "Не указаны"
        
        # Опыт работы
        experience = user_data.get("experience", "Не указан")
        
        # Формируем строку с данными
        result = f"{name} - {title} | Опыт: {experience} | Навыки: {skills_str}"
        
        formatted_results.append(result)
    
    return formatted_results
```

**Примечание для продакшена**:
Для более продвинутого форматирования можно реализовать:

```python
async def format_data(enriched_data: List[Dict[str, Any]], format_type: str = "text") -> List[str]:
    """
    Форматирует обогащенные данные в удобочитаемый вид.
    
    Args:
        enriched_data (List[Dict[str, Any]]): Список обогащенных данных о кандидатах
        format_type (str): Тип форматирования ("text", "html", "markdown")
        
    Returns:
        List[str]: Список отформатированных строк
    """
    logging.info(f"Форматирование данных в формате {format_type} для {len(enriched_data)} кандидатов")
    
    formatted_results = []
    
    for user_data in enriched_data:
        if format_type == "html":
            # HTML форматирование для веб-интерфейса
            html = f"""
            <div class="candidate-card">
                <h3>{user_data.get('name', 'Нет имени')}</h3>
                <p class="title">{user_data.get('title', 'Нет должности')}</p>
                <p><strong>Опыт:</strong> {user_data.get('experience', 'Не указан')}</p>
                <p><strong>Навыки:</strong> {', '.join(user_data.get('skills', ['Не указаны']))}</p>
                <p><strong>Контакт:</strong> {user_data.get('contact', 'Нет контактных данных')}</p>
            </div>
            """
            formatted_results.append(html)
            
        elif format_type == "markdown":
            # Markdown форматирование
            md = f"""
            ## {user_data.get('name', 'Нет имени')}
            
            **Должность:** {user_data.get('title', 'Нет должности')}
            
            **Опыт:** {user_data.get('experience', 'Не указан')}
            
            **Навыки:** {', '.join(user_data.get('skills', ['Не указаны']))}
            
            **Контакт:** {user_data.get('contact', 'Нет контактных данных')}
            """
            formatted_results.append(md.strip())
            
        else:
            # Текстовое форматирование (по умолчанию)
            text = f"{user_data.get('name', 'Нет имени')} - {user_data.get('title', 'Нет должности')} | "
            text += f"Опыт: {user_data.get('experience', 'Не указан')} | "
            text += f"Навыки: {', '.join(user_data.get('skills', ['Не указаны']))}"
            
            formatted_results.append(text)
    
    return formatted_results
```

Вы также можете добавить дополнительные форматы вывода (JSON, CSV) и расширенную настройку вывода в зависимости от требований клиента.

### Dockerfile
**Назначение**: Инструкции для создания Docker-образа микросервиса.

**Содержимое**:
```dockerfile
FROM python:3.11

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
```

### requirements.txt
**Назначение**: Список зависимостей для установки.

**Содержимое**:
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
```

## Примеры запросов

### Запрос
```bash
curl -X POST "http://localhost:8003/api/v1/format" -H "Content-Type: application/json" -d '{"candidates": ["user1", "user2"]}'
```

### Ответ
```json
{
  "formatted_candidates": [
    "Иван Иванов - Разработчик (навыки: Python, FastAPI, Docker), опыт: 5 лет",
    "Петр Петров - Дизайнер (навыки: UI, UX, Figma), опыт: 3 года"
  ]
}
```

## Тестирование
Для тестирования микросервиса необходимо написать:
1. Юнит-тесты для форматирования и обогащения данных
2. Интеграционные тесты для проверки API
3. Нагрузочные тесты для проверки производительности

## Для нейросетей

Ниже представлены инструкции для генерации кода всего микросервиса Output Formatter с помощью нейросети:

```
Сгенерируй код для микросервиса Output Formatter системы "Строка". Этот микросервис принимает список идентификаторов кандидатов от Vector Search, обогащает их данными из базы данных (для MVP - мок) и форматирует результаты в удобном для пользователя виде.

Структура микросервиса:

1. main.py - Входная точка FastAPI приложения
- Должен создать экземпляр FastAPI с заголовком "Строка API - Output Formatter"
- Подключить роутер из api/endpoints.py
- Настроить CORS middleware для всех источников
- Запустить uvicorn сервер на порту 8003

2. api/endpoints.py - Эндпоинты API
- Создать роутер FastAPI с префиксом "/api/v1"
- Определить POST эндпоинт "/format", который:
  - Принимает JSON с полем "candidates" (список строк)
  - Вызывает функцию enrich_data из services/data_enricher.py
  - Вызывает функцию format_data из services/formatter.py
  - Возвращает результаты в формате {"formatted_candidates": [список строк]}
- Добавить обработку ошибок и логирование

3. schemas/request.py - Схема запроса
- Определить Pydantic модель FormatterRequest с полем candidates (список строк)
- Добавить пример в схему с кандидатами ["user1", "user2"]

4. schemas/response.py - Схема ответа
- Определить Pydantic модель FormatterResponse с полем formatted_candidates (список строк)
- Добавить пример в схему

5. services/data_enricher.py - Сервис обогащения данных
- Асинхронная функция enrich_data, которая:
  - Принимает список идентификаторов кандидатов (список строк)
  - Для MVP создает мок-базу данных с информацией о пользователях:
    - user1: {"name": "Иван Иванов", "title": "Разработчик", "skills": ["Python", "FastAPI", "Docker"], "experience": "5 лет"}
    - user2: {"name": "Петр Петров", "title": "Дизайнер", "skills": ["UI", "UX", "Figma"], "experience": "3 года"}
  - Для каждого ID ищет информацию в моке и добавляет ID к данным
  - Возвращает список обогащенных данных

6. services/formatter.py - Сервис форматирования
- Асинхронная функция format_data, которая:
  - Принимает список обогащенных данных (список словарей)
  - Форматирует каждую запись, объединяя имя, должность, навыки и опыт в одну строку
  - Обрабатывает случаи, когда некоторых данных может не быть
  - Возвращает список отформатированных строк

Все модули должны использовать асинхронный подход, правильно обрабатывать ошибки, и включать документацию (docstrings).
```

При вставке этого текста в нейросеть, она должна сгенерировать полный код для всех файлов микросервиса Output Formatter. 

## Инструкции по развертыванию

### Установка и запуск
1. **Создание Docker образа**
   ```bash
   docker build -t output-formatter .
   ```

2. **Запуск контейнера**
   ```bash
   docker run -p 8003:8003 output-formatter
   ```

### Требования к системе
- Python 3.11+
- FastAPI
- Docker 