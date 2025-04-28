from typing import List

async def get_vector_embedding(query: str) -> List[float]:
    """
    Мок функция получения векторов из DeepSeek модели.
    В реальном коде здесь был бы запрос к API модели DeepSeek.
    """
    # Просто возвращаем фиксированный вектор для демонстрации
    return [0.1, 0.2, 0.3] 