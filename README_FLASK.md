# Запуск визуализатора потоков данных через Flask

Этот проект предоставляет веб-сервер на Flask для запуска визуализатора потоков данных.

## Установка

1. Убедитесь, что у вас установлен Python 3.7 или выше
2. Установите зависимости:

```bash
pip install -r requirements.txt
```

## Запуск сервера

```bash
python app.py
```

После запуска сервер будет доступен по адресу http://127.0.0.1:5000/

## Функциональность сервера

1. Обслуживание статических файлов (HTML, CSS, JS)
2. Доступ к примерам потоков данных из папки examples/
3. API для сохранения и загрузки пользовательских потоков:
   - GET /api/flows - получить список всех доступных потоков
   - POST /api/flows - сохранить новый поток данных

## Структура проекта

```
project/
├── app.py              # Flask-приложение
├── requirements.txt    # Зависимости Python
├── index.html          # Основной HTML файл
├── css/
│   └── styles.css      # Стили для визуализации
├── js/
│   └── script.js       # JavaScript для интерактивности
├── examples/           # Примеры потоков данных
│   ├── simple.json
│   └── complex.json
└── user_flows/         # Пользовательские потоки (создаётся автоматически)
```

## Интеграция с JavaScript

Чтобы использовать серверные API в вашем JavaScript, вы можете добавить в файл js/script.js следующий код для сохранения потока на сервере:

```javascript
// Пример сохранения потока на сервере
function saveFlowToServer() {
    fetch('/api/flows', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentFlow),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Поток сохранен:', data);
        alert('Поток успешно сохранен на сервере!');
    })
    .catch((error) => {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка при сохранении потока!');
    });
}

// Пример загрузки списка потоков с сервера
function loadFlowsList() {
    fetch('/api/flows')
    .then(response => response.json())
    .then(flows => {
        console.log('Доступные потоки:', flows);
        // Здесь можно обновить выпадающий список
    })
    .catch((error) => {
        console.error('Ошибка загрузки списка:', error);
    });
}
``` 