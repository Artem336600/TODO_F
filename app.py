from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Необходимо для работы с сессиями

# Значения по умолчанию для блоков файлов
DEFAULT_BLOCKS = [
    {"id": 0, "filename": "api.py", "description": "Обработка API-запросов. Определение эндпоинтов (GET, POST и т.д.), взаимодействие с БД и сервисами. Основной интерфейс приложения."},
    {"id": 1, "filename": "search_engine.py", "description": "Содержит логику поискового движка. Индексация данных, обработка поисковых запросов, ранжирование результатов."},
    {"id": 2, "filename": "utils.py", "description": "Вспомогательные функции и утилиты, используемые в разных частях проекта. Например, форматирование дат, валидация данных, общие константы."},
    {"id": 3, "filename": "models.py", "description": "Определение моделей данных, ORM-классы, схемы и структуры БД."},
    {"id": 4, "filename": "config.py", "description": "Конфигурация приложения, настройки подключения к БД, константы и параметры среды."}
]

@app.route('/')
def index():
    # Если блоков в сессии нет, используем значения по умолчанию
    if 'blocks' not in session:
        session['blocks'] = DEFAULT_BLOCKS
    
    # Если настройки темы нет, используем стандартную
    if 'theme' not in session:
        session['theme'] = {
            'primary_bg': '#0f172a',
            'secondary_bg': '#1e293b',
            'accent_color': '#3b82f6',
            'text_color': '#e2e8f0'
        }
    
    return render_template('index.html', blocks=session['blocks'], theme=session['theme'])

@app.route('/api/blocks', methods=['GET'])
def get_blocks():
    if 'blocks' not in session:
        session['blocks'] = DEFAULT_BLOCKS
    return jsonify(session['blocks'])

@app.route('/api/blocks', methods=['POST'])
def update_blocks():
    blocks = request.json
    session['blocks'] = blocks
    return jsonify({"status": "success"})

@app.route('/api/blocks/<int:block_id>', methods=['DELETE'])
def delete_block(block_id):
    if 'blocks' in session:
        session['blocks'] = [block for block in session['blocks'] if block['id'] != block_id]
    return jsonify({"status": "success"})

@app.route('/api/blocks/add', methods=['POST'])
def add_block():
    new_block = request.json
    
    if 'blocks' not in session:
        session['blocks'] = DEFAULT_BLOCKS
    
    # Определяем новый ID (максимальный ID + 1)
    if session['blocks']:
        new_id = max(block['id'] for block in session['blocks']) + 1
    else:
        new_id = 0
    
    new_block['id'] = new_id
    session['blocks'].append(new_block)
    
    return jsonify({"status": "success", "id": new_id})

@app.route('/api/theme', methods=['POST'])
def update_theme():
    theme = request.json
    session['theme'] = theme
    return jsonify({"status": "success"})

@app.route('/api/reset', methods=['POST'])
def reset_settings():
    session['blocks'] = DEFAULT_BLOCKS
    session['theme'] = {
        'primary_bg': '#0f172a',
        'secondary_bg': '#1e293b',
        'accent_color': '#3b82f6',
        'text_color': '#e2e8f0'
    }
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True) 