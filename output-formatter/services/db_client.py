from typing import List, Dict

# Мок базы данных с информацией о пользователях
MOCK_DB: Dict[str, Dict[str, str]] = {
    "user1": {"name": "Иван Иванов", "role": "Разработчик"},
    "user2": {"name": "Петр Петров", "role": "Дизайнер"}
}

async def get_formatted_info(candidates: List[str]) -> List[str]:
    """
    Мок получения дополнительной информации о кандидатах из базы данных.
    В реальном коде здесь был бы запрос к базе данных.
    """
    result = []
    for candidate in candidates:
        if candidate in MOCK_DB:
            user_info = MOCK_DB[candidate]
            result.append(f"{user_info['name']} - {user_info['role']}")
        else:
            result.append(f"{candidate} - Информация отсутствует")
    
    return result 