// Глобальные переменные
let currentFlow = {
    title: "Новый поток данных",
    description: "Описание потока данных",
    blocks: [],
    connections: []
};

// Переменные для режима редактирования
let isEditMode = false;
let editingBlockId = null;

// DOM-элементы
const diagramContainer = document.getElementById('diagram');
const flowSelector = document.getElementById('flow-selector');
const jsonFileInput = document.getElementById('json-file');
const uploadButton = document.getElementById('upload-json');
const blockForm = document.getElementById('block-form');
const saveFlowButton = document.getElementById('save-flow');
const creatorPanel = document.getElementById('creator-panel');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const editBlockIdInput = document.getElementById('edit-block-id');
const saveServerButton = document.createElement('button');
saveServerButton.type = 'button';
saveServerButton.id = 'save-server';
saveServerButton.textContent = 'Сохранить на сервере';
saveServerButton.style.marginLeft = '10px';

// Элементы для вставки JSON
const pasteJsonButton = document.getElementById('paste-json');
const jsonModal = document.getElementById('json-modal');
const jsonInput = document.getElementById('json-input');
const validateJsonButton = document.getElementById('validate-json');
const loadJsonButton = document.getElementById('load-json');
const jsonError = document.getElementById('json-error');
const closeModalButton = document.querySelector('.close-modal');

// Инициализация
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Добавляем кнопку сохранения на сервере
    saveFlowButton.parentNode.insertBefore(saveServerButton, saveFlowButton.nextSibling);
    
    // Загружаем доступные потоки с сервера
    loadFlowsList();
    
    // Обработчики событий
    flowSelector.addEventListener('change', handleFlowSelection);
    jsonFileInput.addEventListener('change', handleFileUpload);
    uploadButton.addEventListener('click', () => jsonFileInput.click());
    blockForm.addEventListener('submit', handleBlockSubmit);
    saveFlowButton.addEventListener('click', saveFlowToJSON);
    saveServerButton.addEventListener('click', saveFlowToServer);
    cancelEditButton.addEventListener('click', cancelEditMode);
    
    // Интерактивность блоков (делегирование событий)
    diagramContainer.addEventListener('click', handleBlockClick);
    
    // Обработчики для модального окна JSON
    pasteJsonButton.addEventListener('click', openJsonModal);
    closeModalButton.addEventListener('click', closeJsonModal);
    validateJsonButton.addEventListener('click', validateJson);
    loadJsonButton.addEventListener('click', loadJsonFromInput);
    
    // Закрыть модальное окно при клике вне его области
    window.addEventListener('click', (e) => {
        if (e.target === jsonModal) {
            closeJsonModal();
        }
    });
    
    // Горячие клавиши для проверки JSON (Ctrl+Enter)
    jsonInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            validateJson();
        }
    });
    
    // Делегирование событий для удаления и редактирования блоков
    diagramContainer.addEventListener('click', handleBlockActions);
}

// Функции для управления блоками
function handleBlockActions(e) {
    // Кнопка удаления
    const deleteButton = e.target.closest('.delete-block');
    if (deleteButton) {
        const block = deleteButton.closest('.block');
        if (block) {
            const blockId = block.id;
            showDeleteConfirmation(block, blockId);
            e.stopPropagation();
            return;
        }
    }
    
    // Кнопка редактирования
    const editButton = e.target.closest('.edit-block');
    if (editButton) {
        const block = editButton.closest('.block');
        if (block) {
            const blockId = block.id;
            enterEditMode(blockId);
            e.stopPropagation();
            return;
        }
    }
}

function enterEditMode(blockId) {
    // Находим блок в текущем потоке данных
    const block = currentFlow.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // Переключаем режим формы на редактирование
    isEditMode = true;
    editingBlockId = blockId;
    
    // Удаляем класс being-edited со всех блоков
    document.querySelectorAll('.block.being-edited').forEach(el => {
        el.classList.remove('being-edited');
    });
    
    // Находим DOM-элемент блока
    const blockElement = document.getElementById(blockId);
    if (!blockElement) return;
    
    // Добавляем класс для стилизации
    blockElement.classList.add('being-edited');
    
    // Сохраняем текущее содержимое для возможности отмены
    blockElement.setAttribute('data-original-content', blockElement.innerHTML);
    
    // Создаем форму редактирования внутри блока
    const inlineForm = document.createElement('form');
    inlineForm.className = 'inline-edit-form';
    
    // Заголовок и иконка
    const headerHTML = `
        <div class="inline-edit-header">
            <div class="form-group">
                <label for="inline-block-icon">Иконка:</label>
                <input type="text" id="inline-block-icon" value="${block.icon}" required>
            </div>
            <div class="form-group">
                <label for="inline-block-title">Название:</label>
                <input type="text" id="inline-block-title" value="${block.title}" required>
            </div>
        </div>
    `;
    
    // Описание
    const descriptionHTML = `
        <div class="form-group">
            <label for="inline-block-description">Описание:</label>
            <textarea id="inline-block-description" required>${block.description}</textarea>
        </div>
    `;
    
    // Детали
    const detailsHTML = `
        <div class="inline-edit-details">
            <h4>Детали</h4>
            <div class="form-group">
                <label for="inline-block-explanation">Подробное объяснение:</label>
                <textarea id="inline-block-explanation">${block.details.explanation || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="inline-block-tasks">Задачи (по одной на строку):</label>
                <textarea id="inline-block-tasks">${block.details.tasks ? block.details.tasks.join('\n') : ''}</textarea>
            </div>
        </div>
    `;
    
    // Входные данные
    const inputDataHTML = `
        <div class="inline-edit-input">
            <h4>Входные данные</h4>
            <div class="form-group">
                <label for="inline-input-title">Заголовок:</label>
                <input type="text" id="inline-input-title" value="${block.inputData?.title || 'Входные данные'}">
            </div>
            <div class="form-group">
                <label for="inline-input-description">Описание:</label>
                <textarea id="inline-input-description">${block.inputData?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="inline-input-format">Формат:</label>
                <select id="inline-input-format">
                    <option value="json" ${block.inputData?.format === 'json' ? 'selected' : ''}>JSON</option>
                    <option value="http" ${block.inputData?.format === 'http' ? 'selected' : ''}>HTTP</option>
                    <option value="text" ${block.inputData?.format === 'text' ? 'selected' : ''}>Текст</option>
                </select>
            </div>
            <div class="form-group">
                <label for="inline-input-data">Данные:</label>
                <textarea id="inline-input-data">${block.inputData?.data || ''}</textarea>
            </div>
        </div>
    `;
    
    // Выходные данные
    const outputDataHTML = `
        <div class="inline-edit-output">
            <h4>Выходные данные</h4>
            <div class="form-group">
                <label for="inline-output-title">Заголовок:</label>
                <input type="text" id="inline-output-title" value="${block.outputData?.title || 'Выходные данные'}">
            </div>
            <div class="form-group">
                <label for="inline-output-description">Описание:</label>
                <textarea id="inline-output-description">${block.outputData?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="inline-output-format">Формат:</label>
                <select id="inline-output-format">
                    <option value="json" ${block.outputData?.format === 'json' ? 'selected' : ''}>JSON</option>
                    <option value="http" ${block.outputData?.format === 'http' ? 'selected' : ''}>HTTP</option>
                    <option value="text" ${block.outputData?.format === 'text' ? 'selected' : ''}>Текст</option>
                </select>
            </div>
            <div class="form-group">
                <label for="inline-output-data">Данные:</label>
                <textarea id="inline-output-data">${block.outputData?.data || ''}</textarea>
            </div>
        </div>
    `;
    
    // Кнопки управления
    const buttonsHTML = `
        <div class="inline-edit-buttons">
            <button type="button" class="inline-save-button">Сохранить</button>
            <button type="button" class="inline-cancel-button">Отмена</button>
        </div>
    `;
    
    // Собираем форму целиком
    inlineForm.innerHTML = headerHTML + descriptionHTML + detailsHTML + inputDataHTML + outputDataHTML + buttonsHTML;
    
    // Очищаем содержимое блока и добавляем форму редактирования
    blockElement.innerHTML = '';
    blockElement.appendChild(inlineForm);
    
    // Добавляем обработчики событий
    blockElement.querySelector('.inline-save-button').addEventListener('click', () => saveInlineEdit(blockElement, blockId));
    blockElement.querySelector('.inline-cancel-button').addEventListener('click', () => cancelInlineEdit(blockElement));
    
    // Добавляем обработчик отправки формы
    inlineForm.addEventListener('submit', handleBlockSubmit);
    
    // Прокручиваем, чтобы блок был виден
    blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function saveInlineEdit(blockElement, blockId) {
    // Находим форму внутри блока
    const form = blockElement.querySelector('.inline-edit-form');
    if (!form) return;
    
    // Создаем событие отправки формы
    const submitEvent = new Event('submit', { cancelable: true });
    
    // Помечаем форму как inline-edit-form (если не помечена)
    form.classList.add('inline-edit-form');
    
    // Вызываем обработчик отправки формы
    form.dispatchEvent(submitEvent);
}

function cancelInlineEdit(blockElement) {
    // Восстанавливаем оригинальное содержимое блока
    const originalContent = blockElement.getAttribute('data-original-content');
    if (originalContent) {
        blockElement.innerHTML = originalContent;
    }
    
    // Сбрасываем режим редактирования
    isEditMode = false;
    editingBlockId = null;
    blockElement.classList.remove('being-edited');
    
    // Восстанавливаем обработчики событий
    const editButton = blockElement.querySelector('.edit-block');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            enterEditMode(blockElement.id);
        });
    }
}

function cancelEditMode() {
    // Сбрасываем режим и флаги
    isEditMode = false;
    editingBlockId = null;
    
    // Удаляем подсветку редактируемого блока
    document.querySelectorAll('.block.being-edited').forEach(el => {
        el.classList.remove('being-edited');
    });
    
    // Сбрасываем UI формы
    formTitle.textContent = 'Создание нового блока';
    document.getElementById('submit-button').textContent = 'Добавить блок';
    document.getElementById('cancel-edit-button').style.display = 'none';
    creatorPanel.classList.remove('edit-mode');
    document.getElementById('edit-block-id').value = '';
    document.getElementById('block-id').disabled = false;
    
    // Очищаем форму
    blockForm.reset();
}

function handleDeleteButtonClick(e) {
    // Ищем, был ли клик по кнопке удаления блока
    const deleteButton = e.target.closest('.delete-block');
    if (!deleteButton) return;
    
    // Находим блок, которому принадлежит кнопка
    const block = deleteButton.closest('.block');
    if (!block) return;
    
    // Получаем ID блока
    const blockId = block.id;
    
    // Показываем подтверждение удаления
    showDeleteConfirmation(block, blockId);
    
    // Останавливаем всплытие события, чтобы не сработал обработчик клика по блоку
    e.stopPropagation();
}

function showDeleteConfirmation(blockElement, blockId) {
    // Создаем или получаем элемент подтверждения
    let confirmDiv = blockElement.querySelector('.confirm-delete');
    
    if (!confirmDiv) {
        confirmDiv = document.createElement('div');
        confirmDiv.className = 'confirm-delete';
        
        const confirmText = document.createElement('p');
        confirmText.textContent = 'Вы уверены, что хотите удалить этот блок?';
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'confirm-delete-buttons';
        
        const yesButton = document.createElement('button');
        yesButton.className = 'confirm-delete-yes';
        yesButton.textContent = 'Да, удалить';
        yesButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBlock(blockId);
        });
        
        const noButton = document.createElement('button');
        noButton.className = 'confirm-delete-no';
        noButton.textContent = 'Отмена';
        noButton.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDiv.classList.remove('active');
        });
        
        buttonsDiv.appendChild(yesButton);
        buttonsDiv.appendChild(noButton);
        
        confirmDiv.appendChild(confirmText);
        confirmDiv.appendChild(buttonsDiv);
        
        blockElement.appendChild(confirmDiv);
    }
    
    // Показываем подтверждение
    confirmDiv.classList.add('active');
}

function deleteBlock(blockId) {
    // Находим блок в DOM
    const blockElement = document.getElementById(blockId);
    if (!blockElement) return;
    
    // Добавляем анимацию удаления
    blockElement.classList.add('deleting');
    
    // Если мы редактируем этот блок, отменяем режим редактирования
    if (isEditMode && editingBlockId === blockId) {
        cancelEditMode();
    }
    
    // Ждем завершения анимации, затем удаляем блок из потока и перерисовываем
    setTimeout(() => {
        // Удаляем блок из массива блоков
        const blockIndex = currentFlow.blocks.findIndex(block => block.id === blockId);
        if (blockIndex !== -1) {
            currentFlow.blocks.splice(blockIndex, 1);
        }
        
        // Удаляем соединения, связанные с блоком
        currentFlow.connections = currentFlow.connections.filter(conn => 
            conn.from !== blockId && conn.to !== blockId
        );
        
        // Перерисовываем поток
        renderFlow(currentFlow);
    }, 300); // Время анимации
}

// Функции для модального окна JSON
function openJsonModal() {
    jsonModal.style.display = 'block';
    jsonInput.focus();
    // Попытаться вставить текст из буфера обмена, если поддерживается браузером
    try {
        navigator.clipboard.readText().then(text => {
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                jsonInput.value = text;
                validateJson();
            }
        }).catch(() => {
            // Молча игнорируем ошибки доступа к буферу обмена
        });
    } catch (e) {
        // Некоторые браузеры не поддерживают API буфера обмена
    }
}

function closeJsonModal() {
    jsonModal.style.display = 'none';
    jsonError.style.display = 'none';
    // Не очищаем текст, чтобы пользователь мог вернуться к редактированию
}

function validateJson() {
    const jsonText = jsonInput.value.trim();
    if (!jsonText) {
        showJsonError('JSON не может быть пустым');
        return false;
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        
        // Проверка наличия необходимых полей
        if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
            showJsonError('JSON должен содержать массив "blocks"');
            return false;
        }
        
        if (!parsed.connections || !Array.isArray(parsed.connections)) {
            showJsonError('JSON должен содержать массив "connections"');
            return false;
        }
        
        // Валидация прошла успешно
        jsonError.style.display = 'none';
        jsonInput.style.borderColor = '#28a745';
        return true;
    } catch (e) {
        showJsonError(`Ошибка парсинга JSON: ${e.message}`);
        return false;
    }
}

function showJsonError(message) {
    jsonError.textContent = `Ошибка: ${message}`;
    jsonError.style.display = 'block';
    jsonInput.style.borderColor = '#dc3545';
}

function loadJsonFromInput() {
    if (validateJson()) {
        try {
            const data = JSON.parse(jsonInput.value);
            currentFlow = data;
            renderFlow(currentFlow);
            closeJsonModal();
            
            // Если редактируем блок, сбрасываем режим редактирования
            if (isEditMode) {
                cancelEditMode();
            }
        } catch (error) {
            showJsonError(`Не удалось загрузить JSON: ${error.message}`);
        }
    }
}

// Функция загрузки списка потоков с сервера
function loadFlowsList() {
    fetch('/api/flows')
    .then(response => response.json())
    .then(flows => {
        console.log('Доступные потоки:', flows);
        
        // Сохраняем выбранное значение
        const currentSelected = flowSelector.value;
        
        // Очищаем текущие опции, оставляя только встроенные
        while (flowSelector.options.length > 3) {
            flowSelector.remove(3);
        }
        
        // Добавляем разделитель, если есть пользовательские потоки
        if (flows.filter(f => f.type === 'user').length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '─────────────────';
            flowSelector.appendChild(separator);
            
            // Добавляем пользовательские потоки
            flows.filter(f => f.type === 'user').forEach(flow => {
                const option = document.createElement('option');
                option.value = flow.path;
                option.textContent = `${flow.name} (пользовательский)`;
                flowSelector.appendChild(option);
            });
        }
        
        // Восстанавливаем выбранное значение, если оно еще существует
        if (Array.from(flowSelector.options).some(opt => opt.value === currentSelected)) {
            flowSelector.value = currentSelected;
        }
    })
    .catch((error) => {
        console.error('Ошибка загрузки списка потоков:', error);
    });
}

// Обработчики событий
function handleFlowSelection() {
    const selectedValue = flowSelector.value;
    
    if (selectedValue === 'custom') {
        jsonFileInput.style.display = 'inline-block';
        uploadButton.style.display = 'inline-block';
    } else {
        jsonFileInput.style.display = 'none';
        uploadButton.style.display = 'none';
        
        // Проверяем, это путь или встроенный пример
        const isPath = selectedValue.startsWith('/');
        const path = isPath ? selectedValue : `examples/${selectedValue}.json`;
        
        // Загрузка примера или пользовательского потока
        fetch(path)
            .then(response => response.json())
            .then(data => {
                currentFlow = data;
                renderFlow(currentFlow);
                
                // Если редактируем блок, сбрасываем режим редактирования
                if (isEditMode) {
                    cancelEditMode();
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки потока:', error);
                diagramContainer.innerHTML = `<div class="loading">Ошибка загрузки: ${error.message}</div>`;
            });
    }
}

function handleFileUpload() {
    const file = jsonFileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            currentFlow = data;
            renderFlow(currentFlow);
            
            // Если редактируем блок, сбрасываем режим редактирования
            if (isEditMode) {
                cancelEditMode();
            }
        } catch (error) {
            console.error('Ошибка парсинга JSON:', error);
            diagramContainer.innerHTML = `<div class="loading">Ошибка парсинга JSON: ${error.message}</div>`;
        }
    };
    reader.readAsText(file);
}

function handleBlockSubmit(e) {
    e.preventDefault();
    
    // Определяем, откуда пришли данные - из основной формы или из встроенного редактирования
    const isInlineEdit = e.target.classList.contains('inline-edit-form');
    let id, title, icon, description, explanation, tasks;
    let inputTitle, inputDescription, inputFormat, inputData;
    let outputTitle, outputDescription, outputFormat, outputData;
    
    if (isInlineEdit) {
        // Данные из встроенного редактирования
        const form = e.target;
        const blockElement = form.closest('.block');
        id = blockElement.id;
        
        title = form.querySelector('#inline-block-title').value;
        icon = form.querySelector('#inline-block-icon').value;
        description = form.querySelector('#inline-block-description').value;
        explanation = form.querySelector('#inline-block-explanation').value;
        tasks = form.querySelector('#inline-block-tasks').value.split('\n').filter(task => task.trim() !== '');
        
        inputTitle = form.querySelector('#inline-input-title').value || 'Входные данные';
        inputDescription = form.querySelector('#inline-input-description').value || '';
        inputFormat = form.querySelector('#inline-input-format').value;
        inputData = form.querySelector('#inline-input-data').value;
        
        outputTitle = form.querySelector('#inline-output-title').value || 'Выходные данные';
        outputDescription = form.querySelector('#inline-output-description').value || '';
        outputFormat = form.querySelector('#inline-output-format').value;
        outputData = form.querySelector('#inline-output-data').value;
    } else {
        // Данные из основной формы
        id = document.getElementById('block-id').value;
        title = document.getElementById('block-title').value;
        icon = document.getElementById('block-icon').value;
        description = document.getElementById('block-description').value;
        explanation = document.getElementById('block-explanation').value;
        tasks = document.getElementById('block-tasks').value.split('\n').filter(task => task.trim() !== '');
        
        inputTitle = document.getElementById('input-title').value || 'Входные данные';
        inputDescription = document.getElementById('input-description').value || '';
        inputFormat = document.getElementById('input-format').value;
        inputData = document.getElementById('input-data').value;
        
        outputTitle = document.getElementById('output-title').value || 'Выходные данные';
        outputDescription = document.getElementById('output-description').value || '';
        outputFormat = document.getElementById('output-format').value;
        outputData = document.getElementById('output-data').value;
    }
    
    // Создание объекта блока
    const blockData = {
        id,
        title,
        icon,
        description,
        details: {
            explanation,
            tasks
        },
        inputData: {
            title: inputTitle,
            description: inputDescription,
            format: inputFormat,
            data: inputData
        },
        outputData: {
            title: outputTitle,
            description: outputDescription,
            format: outputFormat,
            data: outputData
        }
    };
    
    if (isEditMode) {
        // Обновление существующего блока
        updateExistingBlock(blockData);
        
        // Показываем уведомление об успешном обновлении
        showNotification(`Блок "${title}" успешно обновлен`, 'success');
    } else {
        // Проверка на уникальность ID при создании нового блока
        if (currentFlow.blocks.some(block => block.id === id)) {
            showNotification(`Блок с ID "${id}" уже существует`, 'error');
            return;
        }
        
        // Добавление нового блока
        addNewBlock(blockData);
        
        // Показываем уведомление об успешном добавлении
        showNotification(`Блок "${title}" успешно добавлен`, 'success');
    }
    
    // Перерисовка диаграммы
    renderFlow(currentFlow);
    
    // Если это встроенное редактирование, восстанавливаем оригинальное содержимое блока
    if (isInlineEdit) {
        const blockElement = e.target.closest('.block');
        blockElement.classList.remove('being-edited');
    } else {
        // Сброс формы и режима редактирования для основной формы
        cancelEditMode();
    }
    
    // Сбрасываем режим редактирования в любом случае
    isEditMode = false;
    editingBlockId = null;
    
    // Прокручиваем к диаграмме, чтобы увидеть результат
    diagramContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateExistingBlock(blockData) {
    // Находим индекс редактируемого блока
    const blockIndex = currentFlow.blocks.findIndex(block => block.id === editingBlockId);
    if (blockIndex === -1) return;
    
    // Обновляем блок, сохраняя исходный ID
    blockData.id = editingBlockId; // Гарантируем, что ID не изменится
    currentFlow.blocks[blockIndex] = blockData;
    
    // Обновляем соединения, если ID изменился (хотя такого не должно быть)
    if (blockData.id !== editingBlockId) {
        currentFlow.connections.forEach(conn => {
            if (conn.from === editingBlockId) conn.from = blockData.id;
            if (conn.to === editingBlockId) conn.to = blockData.id;
        });
    }
}

function addNewBlock(blockData) {
    // Добавление блока в поток
    currentFlow.blocks.push(blockData);
    
    // Если это не первый блок, добавляем соединение с предыдущим
    if (currentFlow.blocks.length > 1) {
        const prevBlockId = currentFlow.blocks[currentFlow.blocks.length - 2].id;
        const connection = {
            from: prevBlockId,
            to: blockData.id,
            label: `Соединение ${prevBlockId} → ${blockData.id}`
        };
        currentFlow.connections.push(connection);
    }
}

function handleBlockClick(e) {
    // Находим ближайший элемент .block от места клика
    const block = e.target.closest('.block.interactive');
    if (!block) return;
    
    // Если клик был по кнопке удаления, редактирования или по подтверждению удаления, не раскрываем блок
    if (e.target.closest('.delete-block') || e.target.closest('.edit-block') || e.target.closest('.confirm-delete')) {
        return;
    }
    
    // Переключаем класс expanded для показа/скрытия деталей
    block.classList.toggle('expanded');
}

// Функции отображения
function renderFlow(flow) {
    // Очистка контейнера
    diagramContainer.innerHTML = '';
    
    // Добавление заголовка потока
    const flowTitle = document.createElement('h2');
    flowTitle.textContent = flow.title;
    flowTitle.style.marginBottom = '10px';
    diagramContainer.appendChild(flowTitle);
    
    // Добавление описания потока
    if (flow.description) {
        const flowDesc = document.createElement('p');
        flowDesc.textContent = flow.description;
        flowDesc.style.marginBottom = '30px';
        diagramContainer.appendChild(flowDesc);
    }
    
    // Отрисовка блоков и соединений
    flow.blocks.forEach((block, index) => {
        // Создание блока
        const blockElement = createBlockElement(block);
        diagramContainer.appendChild(blockElement);
        
        // Если не последний блок, добавляем стрелку
        if (index < flow.blocks.length - 1) {
            const nextBlock = flow.blocks[index + 1];
            const connection = flow.connections.find(conn => conn.from === block.id && conn.to === nextBlock.id);
            
            if (connection) {
                const arrowElement = createArrowElement(connection);
                diagramContainer.appendChild(arrowElement);
            }
        }
    });
}

function createBlockElement(block) {
    const blockElement = document.createElement('div');
    blockElement.className = 'block interactive';
    blockElement.id = block.id;
    
    // Шапка блока
    const headerElement = document.createElement('div');
    headerElement.className = 'block-header';
    
    // Иконка
    const iconElement = document.createElement('i');
    iconElement.className = `fa-solid ${block.icon} block-icon`;
    headerElement.appendChild(iconElement);
    
    // Заголовок
    const titleElement = document.createElement('h3');
    titleElement.textContent = block.title;
    headerElement.appendChild(titleElement);
    
    blockElement.appendChild(headerElement);
    
    // Контейнер для кнопок управления
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'block-controls';
    
    // Кнопка редактирования блока
    const editButton = document.createElement('div');
    editButton.className = 'edit-block';
    editButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    editButton.title = 'Редактировать блок';
    controlsContainer.appendChild(editButton);
    
    // Кнопка удаления блока
    const deleteButton = document.createElement('div');
    deleteButton.className = 'delete-block';
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteButton.title = 'Удалить блок';
    controlsContainer.appendChild(deleteButton);
    
    blockElement.appendChild(controlsContainer);
    
    // Если блок в режиме редактирования, добавляем соответствующий класс
    if (isEditMode && editingBlockId === block.id) {
        blockElement.classList.add('being-edited');
    }
    
    // Описание
    const descElement = document.createElement('p');
    descElement.textContent = block.description;
    blockElement.appendChild(descElement);
    
    // Детали (скрытый по умолчанию раздел)
    const detailsElement = document.createElement('div');
    detailsElement.className = 'details';
    
    // Объяснение
    if (block.details.explanation) {
        const explanationElement = document.createElement('strong');
        explanationElement.textContent = 'Подробности:';
        detailsElement.appendChild(explanationElement);
        
        const explParagraph = document.createElement('p');
        explParagraph.textContent = block.details.explanation;
        detailsElement.appendChild(explParagraph);
    }
    
    // Задачи
    if (block.details.tasks && block.details.tasks.length > 0) {
        const tasksTitle = document.createElement('strong');
        tasksTitle.textContent = 'Задачи:';
        detailsElement.appendChild(tasksTitle);
        
        const tasksList = document.createElement('ul');
        block.details.tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.textContent = task;
            tasksList.appendChild(taskItem);
        });
        detailsElement.appendChild(tasksList);
    }
    
    // Входные данные
    if (block.inputData && block.inputData.data) {
        const inputElement = document.createElement('div');
        inputElement.className = 'received-data';
        
        const inputTitle = document.createElement('strong');
        inputTitle.innerHTML = `<i class="fa-solid fa-inbox"></i> ${block.inputData.title}`;
        inputElement.appendChild(inputTitle);
        
        if (block.inputData.description) {
            const inputDesc = document.createElement('p');
            inputDesc.textContent = block.inputData.description;
            inputElement.appendChild(inputDesc);
        }
        
        // Данные в формате code
        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.className = `language-${block.inputData.format}`;
        codeElement.textContent = block.inputData.data;
        preElement.appendChild(codeElement);
        inputElement.appendChild(preElement);
        
        detailsElement.appendChild(inputElement);
    }
    
    // Выходные данные
    if (block.outputData && block.outputData.data) {
        const outputElement = document.createElement('div');
        outputElement.className = 'return-value';
        
        const outputTitle = document.createElement('strong');
        outputTitle.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${block.outputData.title}`;
        outputElement.appendChild(outputTitle);
        
        if (block.outputData.description) {
            const outputDesc = document.createElement('p');
            outputDesc.textContent = block.outputData.description;
            outputElement.appendChild(outputDesc);
        }
        
        // Данные в формате code
        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.className = `language-${block.outputData.format}`;
        codeElement.textContent = block.outputData.data;
        preElement.appendChild(codeElement);
        outputElement.appendChild(preElement);
        
        detailsElement.appendChild(outputElement);
    }
    
    blockElement.appendChild(detailsElement);
    
    return blockElement;
}

function createArrowElement(connection) {
    const arrowContainer = document.createElement('div');
    arrowContainer.className = 'arrow-container';
    
    const arrowLabel = document.createElement('div');
    arrowLabel.className = 'arrow-label';
    arrowLabel.textContent = connection.label || 'Переход данных';
    arrowContainer.appendChild(arrowLabel);
    
    const arrowLine = document.createElement('div');
    arrowLine.className = 'arrow-line';
    arrowContainer.appendChild(arrowLine);
    
    const arrow = document.createElement('div');
    arrow.className = 'arrow';
    arrowContainer.appendChild(arrow);
    
    return arrowContainer;
}

// Сохранение потока в локальный JSON-файл
function saveFlowToJSON() {
    const dataStr = JSON.stringify(currentFlow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'flow.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Сохранение потока на сервере
function saveFlowToServer() {
    // Запрашиваем у пользователя название и описание
    const title = prompt('Введите название потока данных:', currentFlow.title);
    if (!title) return; // Пользователь отменил
    
    const description = prompt('Введите описание потока (опционально):', currentFlow.description);
    
    // Обновляем данные потока
    currentFlow.title = title;
    currentFlow.description = description || '';
    
    // Отправляем на сервер
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
        
        // Обновляем список доступных потоков
        loadFlowsList();
    })
    .catch((error) => {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка при сохранении потока на сервере!');
    });
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    document.querySelectorAll('.notification').forEach(note => {
        note.remove();
    });
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Добавляем иконку в зависимости от типа
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fa-solid fa-check-circle"></i> ';
            break;
        case 'error':
            icon = '<i class="fa-solid fa-exclamation-circle"></i> ';
            break;
        case 'info':
        default:
            icon = '<i class="fa-solid fa-info-circle"></i> ';
            break;
    }
    
    notification.innerHTML = icon + message;
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Запускаем анимацию появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 