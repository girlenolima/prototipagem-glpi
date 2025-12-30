const draggablesSidebar = document.querySelectorAll('.draggable-item');
const canvas = document.getElementById('formCanvas');
const emptyMsg = document.getElementById('emptyMsg');
const structureContent = document.getElementById('structureContent');

// --- Drag & Drop Sidebar ---
draggablesSidebar.forEach(draggable => {
    draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('inputType', draggable.getAttribute('data-type'));
        e.dataTransfer.setData('origin', 'sidebar');
    });
});

// --- Eventos Canvas ---
canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    canvas.classList.add('drag-over');
    const draggingItem = document.querySelector('.dragging');
    if (draggingItem) {
        const afterElement = getDragAfterElement(canvas, e.clientX, e.clientY);
        if (afterElement == null) canvas.appendChild(draggingItem);
        else canvas.insertBefore(draggingItem, afterElement);
    }
});

canvas.addEventListener('dragleave', () => canvas.classList.remove('drag-over'));

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    if(emptyMsg) emptyMsg.style.display = 'none';

    const origin = e.dataTransfer.getData('origin');
    if (origin === 'sidebar') {
        createElement(e.dataTransfer.getData('inputType'));
    } else {
        updateStructureSidebar();
    }
});

function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.form-group:not(.dragging)')];
    return draggableElements.find(child => {
        const box = child.getBoundingClientRect();
        if (y < box.top - 10) return true;
        if (y >= box.top - 10 && y <= box.bottom + 10) {
            if (x < box.left + box.width / 2) return true;
        }
        return false;
    });
}

// --- Criação do Elemento ---
function createElement(type) {
    const formGroup = document.createElement('div');
    formGroup.classList.add('form-group');
    formGroup.setAttribute('draggable', 'true');
    formGroup.setAttribute('data-field-type', type); 

    let inputHtml = '';
    let labelText = 'Novo Campo';
    let extraHtml = ''; 

    switch (type) {
        case 'text':
            labelText = 'Título Curto';
            inputHtml = '<input type="text" class="form-control" placeholder="...">';
            break;
        case 'richtext':
            labelText = 'Descrição Detalhada';
            inputHtml = `
            <div class="rich-editor-container">
                <div class="rich-toolbar">
                    <button class="rt-btn"><b>B</b></button><button class="rt-btn"><i>I</i></button>
                    <div class="rt-separator"></div><button class="rt-btn">🔗</button>
                </div>
                <div class="rich-content-area" contenteditable="true"></div>
            </div>`;
            break;
        case 'date':
            labelText = 'Data';
            inputHtml = '<input type="date" class="form-control">';
            break;
        case 'textarea':
            labelText = 'Observações';
            inputHtml = '<textarea class="form-control"></textarea>';
            break;
            
        case 'select':
            labelText = 'Seleção';
            inputHtml = '<select class="form-control main-select"><option>Opção 1</option><option>Opção 2</option></select>';
            extraHtml = createOptionsManagerHtml();
            break;
        
        // --- RADIO BUTTONS ---
        case 'radio':
            labelText = 'Escolha Única';
            inputHtml = `
            <div class="radio-preview-group">
                <label style="display:block; margin-bottom:2px;"><input type="radio" disabled> Opção 1</label>
                <label style="display:block; margin-bottom:2px;"><input type="radio" disabled> Opção 2</label>
            </div>
            <select class="form-control main-select" style="display:none"><option>Opção 1</option><option>Opção 2</option></select>
            `;
            extraHtml = createOptionsManagerHtml();
            break;

        // --- TÍTULO DE SEÇÃO ---
        case 'header':
            labelText = 'Novo Título de Seção';
            inputHtml = '<hr style="border:0; border-top:1px solid #ccc; margin:10px 0;">';
            extraHtml = `<style>.form-group[data-field-type="header"] label { font-size:16px; color:#2c3e50; border-bottom:2px solid #3498db; display:block; padding-bottom:5px; width:100%; }</style>`;
            break;

        case 'file':
            labelText = 'Anexo';
            inputHtml = '<input type="file" class="form-control">';
            break;
    }

    formGroup.innerHTML = `
        <div class="move-handle"></div>
        <div class="field-options">
            <label class="option-checkbox"><input type="checkbox" onchange="toggleRequired(this)"> Obrigatório</label>
        </div>
        <label contenteditable="true" class="editable-label">${labelText}</label>
        
        ${inputHtml}
        ${extraHtml} 
        
        <button class="remove-btn" onclick="removeItem(this)" title="Excluir">X</button>
        <div class="field-resizer"></div>
    `;

    addDragEventsToItem(formGroup);
    canvas.appendChild(formGroup);
    makeFieldResizable(formGroup);
    updateStructureSidebar();
}

// Helper para gerar o HTML do gerenciador de opções
function createOptionsManagerHtml() {
    return `
    <div class="options-manager">
        <button class="btn-toggle-options" onclick="toggleOptionsManager(this)">
            ▼ Gerenciar Opções
        </button>
        <div class="options-content">
            <div class="add-option-group">
                <input type="text" placeholder="Nova opção" onkeypress="handleEnterOption(event, this)">
                <button class="btn-add-opt" onclick="addOptionBtn(this)">+</button>
            </div>
            <ul class="options-list-preview">
                <li class="opt-chip">Opção 1 <span class="opt-remove" onclick="removeOption(this)">✖</span></li>
                <li class="opt-chip">Opção 2 <span class="opt-remove" onclick="removeOption(this)">✖</span></li>
            </ul>
        </div>
    </div>`;
}

// --- FUNÇÕES DE GERENCIAMENTO DE OPÇÕES ---

window.toggleOptionsManager = function(btn) {
    const content = btn.nextElementSibling;
    if (content.style.display === 'block') {
        content.style.display = 'none';
        btn.innerHTML = '▼ Gerenciar Opções';
    } else {
        content.style.display = 'block';
        btn.innerHTML = '▲ Ocultar Opções';
        const input = content.querySelector('input');
        if(input) setTimeout(() => input.focus(), 100);
    }
}

window.addOptionBtn = function(btn) {
    const input = btn.previousElementSibling;
    const text = input.value.trim();
    if(text) {
        addOptionToField(btn.closest('.form-group'), text);
        input.value = '';
        input.focus();
    }
}

window.handleEnterOption = function(e, input) {
    if(e.key === 'Enter') {
        const text = input.value.trim();
        if(text) {
            addOptionToField(input.closest('.form-group'), text);
            input.value = '';
        }
    }
}

function addOptionToField(formGroup, text) {
    const selectElement = formGroup.querySelector('select.main-select');
    const ulList = formGroup.querySelector('.options-list-preview');
    const isRadio = formGroup.getAttribute('data-field-type') === 'radio';

    const newOption = document.createElement('option');
    newOption.text = text;
    newOption.value = text;
    selectElement.add(newOption);

    const li = document.createElement('li');
    li.className = 'opt-chip';
    li.innerHTML = `${text} <span class="opt-remove" onclick="removeOption(this)">✖</span>`;
    ulList.appendChild(li);

    if (isRadio) {
        const radioContainer = formGroup.querySelector('.radio-preview-group');
        if(radioContainer) {
            const labelRadio = document.createElement('label');
            labelRadio.style.display = 'block';
            labelRadio.style.marginBottom = '2px';
            labelRadio.innerHTML = `<input type="radio" disabled> ${text}`;
            radioContainer.appendChild(labelRadio);
        }
    }

    updateStructureSidebar();
}

window.removeOption = function(span) {
    const li = span.parentElement;
    const textToRemove = li.innerText.replace('✖', '').trim();
    const formGroup = li.closest('.form-group');
    const selectElement = formGroup.querySelector('select.main-select');
    const isRadio = formGroup.getAttribute('data-field-type') === 'radio';

    li.remove();

    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text === textToRemove) {
            selectElement.remove(i);
            break;
        }
    }

    if (isRadio) {
        const radioContainer = formGroup.querySelector('.radio-preview-group');
        const labels = radioContainer.querySelectorAll('label');
        for (let lbl of labels) {
            if (lbl.innerText.trim() === textToRemove) {
                lbl.remove();
                break;
            }
        }
    }

    updateStructureSidebar();
}

// --- Funções Auxiliares Comuns ---
window.toggleRequired = function(checkbox) {
    const formGroup = checkbox.closest('.form-group');
    if (checkbox.checked) formGroup.classList.add('required-active');
    else formGroup.classList.remove('required-active');
    updateStructureSidebar();
}

window.removeItem = function(btn) {
    btn.parentElement.remove();
    if(canvas.querySelectorAll('.form-group').length === 0) emptyMsg.style.display = 'block';
    updateStructureSidebar();
}

function addDragEventsToItem(item) {
    item.addEventListener('dragstart', (e) => {
        if (e.target.closest('.rich-content-area') || 
            e.target.closest('input') || 
            e.target.closest('.field-options') || 
            e.target.closest('.options-manager') || 
            e.target.closest('.field-resizer')) {
             e.preventDefault(); return;
        }
        e.dataTransfer.setData('origin', 'internal');
        setTimeout(() => item.classList.add('dragging'), 0);
    });
    
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        updateStructureSidebar(); 
    });
}

function makeFieldResizable(element) {
    const resizer = element.querySelector('.field-resizer');
    resizer.addEventListener('mousedown', function(e) {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
        function doDrag(e) { element.style.width = (startWidth + (e.clientX - startX)) + 'px'; }
        function stopDrag() { 
            window.removeEventListener('mousemove', doDrag); 
            window.removeEventListener('mouseup', stopDrag);
        }
        window.addEventListener('mousemove', doDrag); window.addEventListener('mouseup', stopDrag);
    });
}

canvas.addEventListener('input', function(e) {
    if (e.target.classList.contains('editable-label')) {
        updateStructureSidebar();
    }
});

// --- ATUALIZAÇÃO DA SIDEBAR ---
function updateStructureSidebar() {
    structureContent.innerHTML = '';
    const fields = document.querySelectorAll('#formCanvas .form-group');
    
    if (fields.length === 0) {
        structureContent.innerHTML = '<p style="color:#777; font-style:italic; font-size:11px;">Nenhum campo criado.</p>';
        return;
    }

    fields.forEach((field, index) => {
        const type = field.getAttribute('data-field-type') || 'desconhecido';
        const labelEl = field.querySelector('.editable-label');
        const labelText = labelEl ? labelEl.innerText.trim() : 'Sem Título';
        const isRequired = field.classList.contains('required-active');

        let optionsHtml = '';
        if (type === 'select' || type === 'radio') {
            const selectEl = field.querySelector('select.main-select');
            if (selectEl && selectEl.options.length > 0) {
                const optionsArr = Array.from(selectEl.options).map(opt => opt.text);
                optionsHtml = `
                <div class="info-line" style="display:block; margin-top:5px; border-top:1px dashed #444; padding-top:4px;">
                    <span class="info-label">Opções:</span> 
                    <div style="color:#bdc3c7; font-size:11px; margin-top:2px; line-height:1.4;">
                        [ ${optionsArr.join(', ')} ]
                    </div>
                </div>`;
            } else {
                optionsHtml = `
                <div class="info-line">
                    <span class="info-label">Opções:</span> 
                    <span class="info-value" style="color:#e74c3c">Nenhuma</span>
                </div>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-line">
                <span class="info-label">#${index + 1} Nome:</span> 
                <span class="info-value info-hl">${labelText}</span>
            </div>
            <div class="info-line">
                <span class="info-label">Tipo:</span> 
                <span class="info-value">${traduzirTipo(type)}</span>
            </div>
            <div class="info-line">
                <span class="info-label">Obrigatório:</span> 
                <span class="info-value" style="color: ${isRequired ? '#e74c3c' : '#2ecc71'}">${isRequired ? 'Sim' : 'Não'}</span>
            </div>
            ${optionsHtml}
        `;
        structureContent.appendChild(card);
    });
}

function traduzirTipo(type) {
    const dic = {
        'text': 'Texto Curto',
        'richtext': 'Texto Rico',
        'date': 'Data',
        'textarea': 'Área Texto',
        'select': 'Seleção',
        'file': 'Arquivo',
        'header': 'Separador de Seção',
        'radio': 'Botões de Opção'
    };
    return dic[type] || type;
}

// --- [NOVO] FUNÇÃO DE EXPORTAÇÃO PARA CSV (EXCEL) ---
function exportToCSV() {
    const fields = document.querySelectorAll('#formCanvas .form-group');
    
    if (fields.length === 0) {
        alert("O formulário está vazio! Adicione campos antes de baixar.");
        return;
    }

    // Cabeçalho da Planilha
    let csvContent = "Ordem,Nome do Campo,Tipo,Obrigatório,Opções (Se houver)\n";

    fields.forEach((field, index) => {
        // 1. Pega os dados básicos
        const type = field.getAttribute('data-field-type') || 'desconhecido';
        
        // Pega o texto do label (limpando quebras de linha extras)
        const labelEl = field.querySelector('.editable-label');
        let labelText = labelEl ? labelEl.innerText.trim() : 'Sem Título';
        
        // Remove aspas duplas do texto para não quebrar o CSV e troca por aspas simples
        labelText = labelText.replace(/"/g, "'");

        const isRequired = field.classList.contains('required-active') ? 'Sim' : 'Não';
        
        // 2. Pega as opções (se for Select ou Radio)
        let optionsStr = "";
        if (type === 'select' || type === 'radio') {
            const selectEl = field.querySelector('select.main-select');
            if (selectEl && selectEl.options.length > 0) {
                // Junta as opções separadas por ponto e vírgula
                const optionsArr = Array.from(selectEl.options).map(opt => opt.text);
                optionsStr = optionsArr.join('; ');
            }
        }

        // 3. Formata a linha do CSV (Colocamos entre aspas para garantir que vírgulas no texto não quebrem colunas)
        let row = `${index + 1},"${labelText}","${traduzirTipo(type)}","${isRequired}","${optionsStr}"`;
        
        csvContent += row + "\n";
    });

    // 4. Cria o arquivo para download
    // \uFEFF é o BOM (Byte Order Mark) para o Excel reconhecer acentos em UTF-8 corretamente
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Cria um link invisível e clica nele
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "prototipo_formulario_glpi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- FUNÇÃO DE COPIAR PARA CLIPBOARD ---
function copyToClipboard(btnElement) {
    const fields = document.querySelectorAll('#formCanvas .form-group');
    
    if (fields.length === 0) {
        alert("O formulário está vazio! Nada para copiar.");
        return;
    }

    // Cabeçalho (Separado por TAB \t para colar colunado no Excel)
    let textData = "Ordem\tNome do Campo\tTipo\tObrigatório\tOpções (Se houver)\n";

    fields.forEach((field, index) => {
        // 1. Pega os dados (mesma lógica do CSV)
        const type = field.getAttribute('data-field-type') || 'desconhecido';
        
        const labelEl = field.querySelector('.editable-label');
        let labelText = labelEl ? labelEl.innerText.trim() : 'Sem Título';
        // Remove quebras de linha e tabs do texto para não quebrar a colagem
        labelText = labelText.replace(/[\r\n\t]+/g, " ");

        const isRequired = field.classList.contains('required-active') ? 'Sim' : 'Não';
        
        // 2. Opções
        let optionsStr = "";
        if (type === 'select' || type === 'radio') {
            const selectEl = field.querySelector('select.main-select');
            if (selectEl && selectEl.options.length > 0) {
                const optionsArr = Array.from(selectEl.options).map(opt => opt.text);
                optionsStr = optionsArr.join('; '); // Ponto e vírgula separa as opções dentro da célula
            }
        }

        // 3. Monta a linha com TABs
        let row = `${index + 1}\t${labelText}\t${traduzirTipo(type)}\t${isRequired}\t${optionsStr}`;
        textData += row + "\n";
    });

    // 4. Copia para a área de transferência
    navigator.clipboard.writeText(textData).then(() => {
        // Feedback Visual no Botão
        const originalText = btnElement.innerText;
        btnElement.innerText = "✅ Copiado!";
        btnElement.style.backgroundColor = "#27ae60"; // Verde temporário
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = ""; // Volta a cor original (Azul)
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
        alert("Erro ao copiar. Seu navegador pode não suportar essa função.");
    });
}