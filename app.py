from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import argparse
from flask_cors import CORS  # Добавляем CORS для безопасной работы с буфером обмена

app = Flask(__name__, static_folder='.')
CORS(app)  # Включаем CORS для всего приложения

# Директория с примерами
EXAMPLES_DIR = 'examples'

@app.route('/')
def index():
    """Отрисовывает главную страницу приложения."""
    return send_from_directory('.', 'index.html')

@app.route('/css/<path:path>')
def send_css(path):
    """Обслуживает CSS файлы."""
    return send_from_directory('css', path)

@app.route('/js/<path:path>')
def send_js(path):
    """Обслуживает JavaScript файлы."""
    return send_from_directory('js', path)

@app.route('/examples')
def list_examples():
    """Возвращает список доступных примеров."""
    examples = []
    for filename in os.listdir(EXAMPLES_DIR):
        if filename.endswith('.json'):
            examples.append(filename)
    return jsonify(examples)

@app.route('/examples/<example_name>')
def get_example(example_name):
    """Загружает и возвращает указанный пример."""
    try:
        with open(os.path.join(EXAMPLES_DIR, example_name), 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/save', methods=['POST'])
def save_flow():
    """Сохраняет поток данных."""
    if not request.is_json:
        return jsonify({"error": "Ожидается JSON"}), 400
    
    data = request.get_json()
    
    # Проверка наличия необходимых полей
    if 'title' not in data or 'blocks' not in data:
        return jsonify({"error": "Отсутствуют обязательные поля"}), 400
    
    # Генерируем имя файла на основе заголовка
    filename = data.get('title', 'custom_flow').lower().replace(' ', '_') + '.json'
    
    try:
        with open(os.path.join(EXAMPLES_DIR, filename), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/validate-json', methods=['POST'])
def validate_json():
    """Валидирует JSON и возвращает результат."""
    if not request.is_json:
        return jsonify({"valid": False, "error": "Ожидается JSON"}), 400
    
    data = request.get_json()
    
    # Проверка структуры JSON
    if not isinstance(data, dict):
        return jsonify({"valid": False, "error": "JSON должен быть объектом"}), 400
    
    # Проверка наличия необходимых полей
    if 'blocks' not in data or not isinstance(data['blocks'], list):
        return jsonify({"valid": False, "error": "JSON должен содержать массив 'blocks'"}), 400
    
    if 'connections' not in data or not isinstance(data['connections'], list):
        return jsonify({"valid": False, "error": "JSON должен содержать массив 'connections'"}), 400
    
    return jsonify({"valid": True})

@app.route('/api/flows', methods=['GET'])
def list_flows():
    """API для получения списка доступных потоков"""
    flows = []
    
    # Примеры
    for example in os.listdir(EXAMPLES_DIR):
        if example.endswith('.json'):
            flows.append({
                "name": example.replace('.json', ''),
                "path": f"/examples/{example}",
                "type": "example"
            })
    
    # Пользовательские потоки
    if os.path.exists('user_flows'):
        for flow in os.listdir('user_flows'):
            if flow.endswith('.json'):
                flows.append({
                    "name": flow.replace('.json', ''),
                    "path": f"/user_flows/{flow}",
                    "type": "user"
                })
    
    return jsonify(flows)

@app.route('/api/flows', methods=['POST'])
def save_flow_api():
    """API для сохранения нового потока данных"""
    if not request.is_json:
        return jsonify({"error": "Ожидается JSON"}), 400
    
    data = request.get_json()
    
    if not os.path.exists('user_flows'):
        os.makedirs('user_flows')
    
    # Проверка обязательных полей
    if 'title' not in data or 'blocks' not in data or 'connections' not in data:
        return jsonify({"error": "Отсутствуют обязательные поля (title, blocks, connections)"}), 400
    
    flow_name = data.get('title', 'flow').lower().replace(' ', '_')
    filename = f"user_flows/{flow_name}.json"
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({"success": True, "filename": filename, "path": f"/user_flows/{flow_name}.json"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user_flows/<path:path>')
def serve_user_flows(path):
    """Обслуживание пользовательских JSON потоков"""
    return send_from_directory('user_flows', path)

def parse_args():
    """Обработка аргументов командной строки"""
    parser = argparse.ArgumentParser(description='Запуск сервера для визуализации потоков данных')
    
    parser.add_argument('--host', type=str, default='127.0.0.1',
                      help='Хост для запуска сервера (по умолчанию: 127.0.0.1)')
    
    parser.add_argument('--port', type=int, default=5000,
                      help='Порт для запуска сервера (по умолчанию: 5000)')
    
    parser.add_argument('--debug', type=lambda x: (str(x).lower() == 'true'), default=True,
                      help='Запуск в режиме отладки (по умолчанию: True)')
    
    return parser.parse_args()

if __name__ == '__main__':
    # Создаем директории, если они не существуют
    for folder in ['examples', 'user_flows']:
        os.makedirs(folder, exist_ok=True)
    
    # Получаем аргументы командной строки
    args = parse_args()
    
    print(f"Интерактивный визуализатор потоков данных запущен!")
    print(f"Откройте http://{args.host}:{args.port}/ в вашем браузере")
    
    app.run(host=args.host, port=args.port, debug=args.debug) 