let fileBlocks;
let fileContainers;
const simulateButton = document.getElementById('simulateButton');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const resetSettings = document.getElementById('resetSettings');
const addBlockButton = document.getElementById('addBlockButton');
const blockModal = document.getElementById('blockModal');
const modalTitle = document.getElementById('modalTitle');
const blockFilename = document.getElementById('blockFilename');
const blockDescription = document.getElementById('blockDescription');
const blockId = document.getElementById('blockId');
const closeModal = document.getElementById('closeModal');
const saveBlockEdit = document.getElementById('saveBlockEdit');
const cancelBlockEdit = document.getElementById('cancelBlockEdit');
const overlay = document.getElementById('overlay');
const blockGap = document.getElementById('blockGap');
const blockSize = document.getElementById('blockSize');
const animationSpeed = document.getElementById('animationSpeed');
const speedValue = document.getElementById('speedValue');
const gapValue = document.getElementById('gapValue');
const sizeValue = document.getElementById('sizeValue');

const animationSettingsToggle = document.getElementById('animationSettingsToggle');
const animationSettingsPanel = document.getElementById('animationSettingsPanel');
const closeAnimationSettings = document.getElementById('closeAnimationSettings');
const saveAnimationSettings = document.getElementById('saveAnimationSettings');
const resetAnimationSettings = document.getElementById('resetAnimationSettings');
const newFileType = document.getElementById('newFileType');
const newDataType = document.getElementById('newDataType');
const addDataType = document.getElementById('addDataType');
const addFileType = document.getElementById('addFileType');
const dataTypesContainer = document.querySelector('.data-types-container');

const colorInputs = document.querySelectorAll('input[type="color"]');

let isSimulating = false;
let animationInterval;
let animationDuration = 1200;
let tempDataTypes = [];

const DEFAULT_DATA_TYPES = {
    'api.py': ['API Request', 'API Response', 'Endpoint Data'],
    'search_engine.py': ['Search Query', 'Search Results', 'Index Data'],
    'utils.py': ['Utility Data', 'Formatted Date', 'Validation Result'],
    'models.py': ['Data Model', 'Schema', 'Database Query'],
    'config.py': ['Config Data', 'Environment Variable', 'Setting']
};

let dataTypes = {...DEFAULT_DATA_TYPES};

document.addEventListener('DOMContentLoaded', () => {
    refreshBlocksList();
    attachEventListeners();
    initRangeControls();
    
    loadDataTypes();
    
    syncAnimationDataWithBlocks();
    
    renderDataTypes();
});

function refreshBlocksList() {
    fileBlocks = document.querySelectorAll('.file-block');
    fileContainers = document.querySelectorAll('.file-container');
    
    document.querySelectorAll('.edit-block-btn').forEach(btn => {
        btn.removeEventListener('click', handleEditBlock);
    });
    
    document.querySelectorAll('.delete-block-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteBlock);
    });
    
    fileBlocks.forEach((block) => {
        block.removeEventListener('click', handleBlockClick);
        
        block.addEventListener('click', handleBlockClick);
    });
    
    document.querySelectorAll('.edit-block-btn').forEach(btn => {
        btn.addEventListener('click', handleEditBlock);
    });
    
    document.querySelectorAll('.delete-block-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteBlock);
    });
}

function attachEventListeners() {
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.file-block') && 
            !event.target.closest('.info-box')) {
            closeAllInfoBoxes();
        }
    });
    
    simulateButton.addEventListener('click', toggleSimulation);
    
    settingsToggle.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
        overlay.classList.toggle('active');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    saveSettings.addEventListener('click', saveThemeSettings);
    resetSettings.addEventListener('click', resetAllSettings);
    
    addBlockButton.addEventListener('click', () => openBlockModal());
    closeModal.addEventListener('click', closeBlockModal);
    cancelBlockEdit.addEventListener('click', closeBlockModal);
    saveBlockEdit.addEventListener('click', saveBlockData);
    
    overlay.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
        animationSettingsPanel.classList.remove('open');
        blockModal.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    colorInputs.forEach(input => {
        input.addEventListener('input', updateColorPreview);
    });
    
    animationSettingsToggle.addEventListener('click', () => {
        const blockCount = syncAnimationDataWithBlocks();
        
        animationSettingsPanel.classList.toggle('open');
        settingsPanel.classList.remove('open');
        overlay.classList.add('active');
        
        if (blockCount === 0) {
            showNotification('Нет блоков файлов для настройки данных анимации', 'info');
        }
    });
    
    closeAnimationSettings.addEventListener('click', () => {
        animationSettingsPanel.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    saveAnimationSettings.addEventListener('click', () => {
        saveDataTypes();
        animationSettingsPanel.classList.remove('open');
        overlay.classList.remove('active');
        showNotification('Настройки анимации сохранены', 'success');
    });
    
    resetAnimationSettings.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить все типы данных к значениям по умолчанию?')) {
            dataTypes = {...DEFAULT_DATA_TYPES};
            renderDataTypes();
            showNotification('Типы данных сброшены к значениям по умолчанию', 'success');
        }
    });
    
    addDataType.addEventListener('click', () => {
        const dataType = newDataType.value.trim();
        if (dataType) {
            if (!tempDataTypes.includes(dataType)) {
                tempDataTypes.push(dataType);
                updateTempDataTypesList();
                newDataType.value = '';
                newDataType.focus();
            } else {
                showNotification('Такой тип данных уже добавлен', 'error');
            }
        } else {
            showNotification('Введите тип данных', 'error');
        }
    });
    
    addFileType.addEventListener('click', () => {
        const fileType = newFileType.value.trim();
        if (fileType && tempDataTypes.length > 0) {
            dataTypes[fileType] = [...tempDataTypes];
            renderDataTypes();
            
            tempDataTypes = [];
            newFileType.value = '';
            newDataType.value = '';
            updateTempDataTypesList();
            
            showNotification(`Тип файла "${fileType}" добавлен с ${tempDataTypes.length} типами данных`, 'success');
        } else {
            if (!fileType) {
                showNotification('Введите имя типа файла', 'error');
            } else if (tempDataTypes.length === 0) {
                showNotification('Добавьте хотя бы один тип данных', 'error');
            }
        }
    });
}

function initRangeControls() {
    animationSpeed.addEventListener('input', () => {
        animationDuration = parseInt(animationSpeed.value);
        speedValue.textContent = (animationDuration / 1000).toFixed(1) + ' сек';
    });
    
    blockGap.addEventListener('input', () => {
        const gap = blockGap.value;
        document.documentElement.style.setProperty('--block-gap', `${gap}px`);
        gapValue.textContent = `${gap}px`;
    });
    
    blockSize.addEventListener('input', () => {
        const size = blockSize.value / 100;
        document.documentElement.style.setProperty('--block-scale', size);
        sizeValue.textContent = `${blockSize.value}%`;
    });
}

function updateColorPreview(e) {
    const property = e.target.dataset.property;
    const value = e.target.value;
    
    if (property === 'accent_color') {
        document.documentElement.style.setProperty('--accent-color', value);
        document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(45deg, ${value}, ${value}aa)`);
    } else if (property === 'primary_bg') {
        document.documentElement.style.setProperty('--primary-bg', value);
    } else if (property === 'secondary_bg') {
        document.documentElement.style.setProperty('--secondary-bg', value);
    } else if (property === 'text_color') {
        document.documentElement.style.setProperty('--text-color-light', value);
    }
}

function saveThemeSettings() {
    const theme = {};
    
    colorInputs.forEach(input => {
        theme[input.dataset.property] = input.value;
    });
    
    fetch('/api/theme', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(theme)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('Настройки успешно сохранены', 'success');
            settingsPanel.classList.remove('open');
            overlay.classList.remove('active');
        }
    })
    .catch(error => {
        console.error('Ошибка при сохранении настроек:', error);
        showNotification('Ошибка при сохранении настроек', 'error');
    });
}

function resetAllSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки? Все изменения будут потеряны.')) {
        fetch('/api/reset', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Ошибка при сбросе настроек:', error);
            showNotification('Ошибка при сбросе настроек', 'error');
        });
    }
}

function closeAllInfoBoxes() {
    document.querySelectorAll('.info-box.visible').forEach(box => {
        box.classList.remove('visible');
    });
    
    document.querySelectorAll('.file-block.info-active').forEach(block => {
        block.classList.remove('info-active');
    });
}

function toggleSimulation() {
    isSimulating = !isSimulating;
    
    if (isSimulating) {
        simulateButton.innerHTML = '<i class="fas fa-stop"></i> Остановить симуляцию';
        simulateButton.classList.add('running');
        runSimulation();
    } else {
        simulateButton.innerHTML = '<i class="fas fa-play"></i> Запустить симуляцию';
        simulateButton.classList.remove('running');
        stopSimulation();
    }
}

function runSimulation() {
    let currentIndex = 0;
    
    if (animationInterval) clearInterval(animationInterval);
    
    animationInterval = setInterval(() => {
        if (fileContainers.length === 0) return;
        
        const currentContainer = fileContainers[currentIndex];
        const nextIndex = findNextContainerIndex(currentIndex);
        
        if (!currentContainer) return;
        
        const currentFilename = currentContainer.querySelector('.filename').textContent;
        
        const possibleData = dataTypes[currentFilename] || 
                             Object.keys(dataTypes).find(key => currentFilename.endsWith(key)) ? 
                                dataTypes[Object.keys(dataTypes).find(key => currentFilename.endsWith(key))] : 
                                ['Data', 'Info', 'Message'];
        
        const dataType = possibleData[Math.floor(Math.random() * possibleData.length)];
        
        createPulse(currentContainer, dataType);
        
        if (fileBlocks[nextIndex]) {
            highlightBlock(fileBlocks[nextIndex]);
        }
        
        currentIndex = nextIndex;
    }, animationDuration);
}

function stopSimulation() {
    clearInterval(animationInterval);
    document.querySelectorAll('.pulse').forEach(pulse => pulse.remove());
    fileBlocks.forEach(block => block.classList.remove('active'));
}

function createPulse(container, dataType) {
    const pulse = document.createElement('div');
    pulse.classList.add('pulse');
    pulse.style.left = '50%';
    pulse.style.top = '100%';
    
    pulse.style.setProperty('--animation-duration', `${animationDuration}ms`);
    
    const label = document.createElement('span');
    label.classList.add('data-label');
    label.textContent = dataType;
    pulse.appendChild(label);
    
    container.appendChild(pulse);
    pulse.classList.add('animate');
    
    pulse.addEventListener('animationend', () => {
        pulse.remove();
    });
}

function highlightBlock(block) {
    block.classList.add('active');
    setTimeout(() => {
        block.classList.remove('active');
    }, 400);
}

function findNextContainerIndex(currentIndex) {
    return (currentIndex + 1) % fileContainers.length;
}

function openBlockModal(id = null, filename = '', description = '') {
    modalTitle.textContent = id !== null ? 'Редактировать файл' : 'Добавить новый файл';
    blockFilename.value = filename;
    blockDescription.value = description;
    blockId.value = id !== null ? id : '';
    
    blockModal.classList.add('open');
    overlay.classList.add('active');
    blockFilename.focus();
}

function closeBlockModal() {
    blockModal.classList.remove('open');
    overlay.classList.remove('active');
    
    blockFilename.value = '';
    blockDescription.value = '';
    blockId.value = '';
}

function handleBlockClick(event) {
    if (event.target.closest('.file-controls')) {
        return;
    }
    
    event.stopPropagation();
    
    const blockContainer = this.closest('.file-container');
    
    closeAllInfoBoxes();
    
    const infoBox = blockContainer.querySelector('.info-box');
    if (infoBox) {
        infoBox.classList.add('visible');
        this.classList.add('info-active');
        console.log('Информационное окно открыто');
    }
}

function handleEditBlock(e) {
    e.stopPropagation();
    
    const blockElement = e.target.closest('.file-block');
    const container = blockElement.closest('.file-container');
    const id = container.dataset.id;
    const filename = blockElement.querySelector('.filename').textContent;
    
    const infoBox = container.querySelector('.info-box');
    const infoBoxStrong = infoBox.querySelector('strong');
    let description = infoBox.innerHTML;
    if (infoBoxStrong) {
        description = description.replace(infoBoxStrong.outerHTML, '').trim();
    }
    
    console.log('Редактирование блока', id, filename, description);
    openBlockModal(id, filename, description);
}

function handleDeleteBlock(e) {
    e.stopPropagation();
    
    const container = e.target.closest('.file-container');
    const id = container.dataset.id;
    
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
        deleteBlock(id);
    }
}

function deleteBlock(id) {
    fetch(`/api/blocks/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const container = document.querySelector(`.file-container[data-id="${id}"]`);
            
            container.remove();
            refreshBlocksList();
            
            syncAnimationDataWithBlocks();
            
            showNotification('Файл успешно удален', 'success');
        }
    })
    .catch(error => {
        console.error('Ошибка при удалении файла:', error);
        showNotification('Ошибка при удалении файла', 'error');
    });
}

function saveBlockData() {
    if (!blockFilename.value.trim()) {
        alert('Пожалуйста, введите имя файла');
        return;
    }
    
    const isEdit = blockId.value !== '';
    const blockData = {
        filename: blockFilename.value.trim(),
        description: blockDescription.value.trim()
    };
    
    if (isEdit) {
        updateExistingBlock(blockId.value, blockData);
    } else {
        addNewBlock(blockData);
    }
}

function addNewBlock(blockData) {
    fetch('/api/blocks/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(blockData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.reload();
            
            syncAnimationDataWithBlocks();
        }
    })
    .catch(error => {
        console.error('Ошибка при добавлении файла:', error);
        showNotification('Ошибка при добавлении файла', 'error');
    });
}

function updateExistingBlock(id, blockData) {
    let oldFilename = '';
    
    fetch('/api/blocks')
    .then(response => response.json())
    .then(blocks => {
        const oldBlock = blocks.find(block => block.id.toString() === id);
        if (oldBlock) {
            oldFilename = oldBlock.filename;
        }
        
        const updatedBlocks = blocks.map(block => {
            if (block.id.toString() === id) {
                return {...block, ...blockData};
            }
            return block;
        });
        
        return fetch('/api/blocks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBlocks)
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const container = document.querySelector(`.file-container[data-id="${id}"]`);
            const block = container.querySelector('.file-block');
            const filename = block.querySelector('.filename');
            const infoBox = container.querySelector('.info-box');
            
            filename.textContent = blockData.filename;
            infoBox.innerHTML = `<strong>${blockData.filename}</strong>${blockData.description}`;
            
            if (oldFilename && oldFilename !== blockData.filename && dataTypes[oldFilename]) {
                dataTypes[blockData.filename] = [...dataTypes[oldFilename]];
                delete dataTypes[oldFilename];
                saveDataTypes();
                renderDataTypes();
            }
            
            closeBlockModal();
            showNotification('Файл успешно обновлен', 'success');
            
            syncAnimationDataWithBlocks();
        }
    })
    .catch(error => {
        console.error('Ошибка при обновлении файла:', error);
        showNotification('Ошибка при обновлении файла', 'error');
    });
}

function showNotification(message, type = 'info') {
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notification {
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
                min-width: 280px;
            }
            
            .notification.success {
                background: #10b981;
            }
            
            .notification.error {
                background: #ef4444;
            }
            
            .notification.info {
                background: #3b82f6;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; visibility: hidden; }
            }
        `;
        document.head.appendChild(style);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `${icon} ${message}`;
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function loadDataTypes() {
    const savedDataTypes = localStorage.getItem('dataTypes');
    if (savedDataTypes) {
        try {
            dataTypes = JSON.parse(savedDataTypes);
        } catch (e) {
            console.error('Ошибка при загрузке типов данных:', e);
            dataTypes = {...DEFAULT_DATA_TYPES};
        }
    }
}

function saveDataTypes() {
    localStorage.setItem('dataTypes', JSON.stringify(dataTypes));
}

function renderDataTypes() {
    dataTypesContainer.innerHTML = '';
    
    Object.entries(dataTypes).forEach(([fileType, types]) => {
        const fileTypeItem = document.createElement('div');
        fileTypeItem.className = 'file-type-item';
        fileTypeItem.innerHTML = `
            <div class="file-type-header">
                <div class="file-type-name">${fileType}</div>
                <div class="file-type-controls">
                    <button class="delete-btn" data-file="${fileType}" title="Удалить тип файла">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="data-type-list" data-file="${fileType}">
                ${types.map(type => `
                    <div class="data-type-tag">
                        ${type}
                        <button class="remove-data-type" data-file="${fileType}" data-type="${type}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        dataTypesContainer.appendChild(fileTypeItem);
    });
    
    attachDataTypeEventListeners();
}

function attachDataTypeEventListeners() {
    document.querySelectorAll('.file-type-controls .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileType = e.currentTarget.dataset.file;
            if (confirm(`Вы уверены, что хотите удалить тип файла "${fileType}" и все его типы данных?`)) {
                delete dataTypes[fileType];
                renderDataTypes();
                showNotification(`Тип файла "${fileType}" удален`, 'success');
            }
        });
    });
    
    document.querySelectorAll('.remove-data-type').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileType = e.currentTarget.dataset.file;
            const dataType = e.currentTarget.dataset.type;
            
            dataTypes[fileType] = dataTypes[fileType].filter(type => type !== dataType);
            
            if (dataTypes[fileType].length === 0) {
                delete dataTypes[fileType];
            }
            
            renderDataTypes();
            showNotification(`Тип данных "${dataType}" удален`, 'success');
        });
    });
}

function updateTempDataTypesList() {
    const tempList = document.querySelector('.temp-data-type-list');
    
    if (!tempList) {
        const container = document.createElement('div');
        container.className = 'temp-data-type-list';
        
        const formGroup = newDataType.closest('.form-group');
        formGroup.insertBefore(container, addDataType);
    }
    
    const tempListElement = document.querySelector('.temp-data-type-list');
    tempListElement.innerHTML = tempDataTypes.map(type => `
        <div class="data-type-tag">
            ${type}
            <button class="remove-temp-data-type" data-type="${type}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.remove-temp-data-type').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dataType = e.currentTarget.dataset.type;
            tempDataTypes = tempDataTypes.filter(type => type !== dataType);
            updateTempDataTypesList();
        });
    });
}

function syncAnimationDataWithBlocks() {
    const currentFilenames = Array.from(document.querySelectorAll('.file-block .filename'))
        .map(el => el.textContent);
    
    console.log('Текущие блоки на экране:', currentFilenames);
    
    const syncedDataTypes = {};
    
    currentFilenames.forEach(filename => {
        if (dataTypes[filename]) {
            syncedDataTypes[filename] = [...dataTypes[filename]];
        } else {
            if (filename.endsWith('.py')) {
                syncedDataTypes[filename] = ['Python Data', 'Module Info', 'Function Result'];
            } else if (filename.endsWith('.js')) {
                syncedDataTypes[filename] = ['JavaScript Data', 'JSON Object', 'Function Result'];
            } else if (filename.endsWith('.html')) {
                syncedDataTypes[filename] = ['HTML Content', 'DOM Event', 'Template Data'];
            } else if (filename.endsWith('.css')) {
                syncedDataTypes[filename] = ['Style Property', 'Media Query', 'Animation Data'];
            } else {
                syncedDataTypes[filename] = ['Data', 'Information', 'Result'];
            }
        }
    });
    
    dataTypes = syncedDataTypes;
    
    saveDataTypes();
    
    renderDataTypes();
    
    return currentFilenames.length;
} 