from typing import List

async def search_by_vector(vector_query: List[float]) -> List[str]:
    """
    Мок функция поиска по вектору с использованием FAISS.
    В реальном коде здесь был бы запрос к FAISS индексу.
    """
    # Просто возвращаем фиксированных кандидатов для демонстрации
    return ["user1", "user2"] 