/**
 * CLASSE 1: FACTORY
 * Gera o HTML dos componentes. 
 */
class FieldFactory {
    static create(type) {
        const item = { label: 'Novo Campo', inputHtml: '', extraStyle: '' };

        switch (type) {
            case 'text':
                item.label = 'Título Curto';
                item.inputHtml = '<input type="text" class="form-control" placeholder="Texto de exemplo...">';
                break;
            case 'textarea':
                item.label = 'Observações';
                item.inputHtml = '<textarea class="form-control" placeholder="..."></textarea>';
                break;
            case 'select':
                item.label = 'Seleção';
                item.inputHtml = '<select class="form-control main-select"><option>Opção 1</option><option>Opção 2</option></select>';
                break;
            case 'radio':
                item.label = 'Escolha Única';
                item.inputHtml = `
                    <div class="radio-preview-group">
                        <label style="display:block; margin-bottom:2px;"><input type="radio" disabled> Opção 1</label>
                        <label style="display:block; margin-bottom:2px;"><input type="radio" disabled> Opção 2</label>
                    </div>
                    <select class="form-control main-select" style="display:none"><option>Opção 1</option><option>Opção 2</option></select>`;
                break;
            case 'date':
                item.label = 'Data';
                item.inputHtml = '<input type="date" class="form-control">';
                break;
            case 'file':
                item.label = 'Anexo';
                item.inputHtml = '<input type="file" class="form-control">';
                break;
            case 'header':
                item.label = 'Título de Seção';
                item.inputHtml = '<hr style="border:0; border-top:1px solid #ccc; margin:10px 0;">';
                item.extraStyle = `<style>.form-group[data-field-type="header"] label { font-size:16px; color:#2c3e50; border-bottom:2px solid #3498db; display:block; padding-bottom:5px; width:100%; }</style>`;
                break;
            case 'richtext':
                item.label = 'Texto Rico';
                item.inputHtml = `
                    <div class="rich-editor-container">
                        <div class="rich-toolbar"><button class="rt-btn"><b>B</b></button><button class="rt-btn"><i>I</i></button></div>
                        <div class="rich-content-area" contenteditable="true"></div>
                    </div>`;
                break;
        }

        return this._buildFinalHtml(type, item);
    }

    static _buildFinalHtml(type, item) {
        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group');
        formGroup.setAttribute('draggable', 'true');
        formGroup.setAttribute('data-field-type', type);
        
        // Evento de clique para selecionar
        formGroup.onclick = (e) => InteractionManager.selectField(e, formGroup);

        formGroup.innerHTML = `
            <div class="move-handle"></div>
            <label class="editable-label">${item.label}</label>
            <small class="help-text" style="display:none; color:#7f8c8d; font-size:11px; margin-bottom:5px;"></small>
            ${item.inputHtml}
            ${item.extraStyle || ''}
            <div class="field-resizer"></div>
        `;
        return formGroup;
    }
}

/**
 * CLASSE 2: PROPERTIES PANEL
 */
class PropertiesPanel {
    static container = document.getElementById('structureContent');
    static activeField = null;

    // ESTADO 1: MODO EDIÇÃO
    static render(fieldElement) {
        this.activeField = fieldElement;
        const type = fieldElement.getAttribute('data-field-type');
        const label = fieldElement.querySelector('.editable-label').innerText;
        const helpEl = fieldElement.querySelector('.help-text');
        const helpText = helpEl ? helpEl.innerText : '';
        const isRequired = fieldElement.classList.contains('required-active');
        
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #444;">
                <h2 style="margin:0; border:none; font-size:14px;">Editar Campo</h2> 
                <button onclick="InteractionManager.deselectAll()" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:11px; font-weight:bold;">✕ FECHAR</button>
            </div>
            <div class="prop-group">
                <label class="prop-label">Título do Campo</label>
                <input type="text" class="prop-input" value="${label}" onkeyup="PropertiesPanel.updateLabel(this.value)">
            </div>
            <div class="prop-group">
                <label class="prop-label">Descrição de Ajuda</label>
                <input type="text" class="prop-input" value="${helpText}" placeholder="Ex: Instruções..." onkeyup="PropertiesPanel.updateHelp(this.value)">
            </div>
        `;

        if(type === 'text' || type === 'textarea') {
            const input = fieldElement.querySelector('.form-control');
            const placeholder = input ? input.placeholder : '';
            html += `<div class="prop-group"><label class="prop-label">Placeholder (Dica)</label><input type="text" class="prop-input" value="${placeholder}" onkeyup="PropertiesPanel.updatePlaceholder(this.value)"></div>`;
        }
        if(type !== 'header') {
            html += `<div class="prop-group"><label class="prop-checkbox"><input type="checkbox" ${isRequired ? 'checked' : ''} onchange="PropertiesPanel.updateRequired(this.checked)"> Marcar como Obrigatório</label></div>`;
        }
        if(type === 'select' || type === 'radio') {
            html += this._renderOptionsManager(fieldElement);
        }
        html += `<button class="btn-delete-element" onclick="PropertiesPanel.deleteActiveField()">🗑 Excluir Campo</button>`;

        this.container.innerHTML = html;
    }

    // ESTADO 2: MODO RESUMO
    static renderSummary() {
        this.activeField = null;
        this.container.innerHTML = '';
        
        const fields = document.querySelectorAll('#formCanvas .form-group');

        if (fields.length === 0) {
            this.container.innerHTML = `
                <h2>Resumo</h2>
                <p style="color:#777; font-style:italic; font-size:11px; text-align:center; margin-top:20px;">
                    Nenhum campo criado. <br>Arraste itens da esquerda.
                </p>`;
            return;
        }

        let listHtml = '<h2 style="margin-bottom:15px;">Resumo do Formulário</h2>';
        
        fields.forEach((field, index) => {
            const type = field.getAttribute('data-field-type');
            const label = field.querySelector('.editable-label').innerText.replace(/\n/g, '').trim() || 'Sem Título';
            const isRequired = field.classList.contains('required-active');
            
            listHtml += `
                <div class="info-card" onclick="InteractionManager.selectField(event, document.querySelectorAll('#formCanvas .form-group')[${index}])">
                    <div class="info-line">
                        <span class="info-label">#${index + 1} Nome</span> 
                        <span class="info-value info-hl">${label}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">Tipo</span> 
                        <span class="info-value">${this._translateType(type)}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">Obrigatório</span> 
                        <span class="info-value" style="color: ${isRequired ? '#e74c3c' : '#2ecc71'}">${isRequired ? 'Sim' : 'Não'}</span>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = listHtml;
    }

    static updateLabel(val) { if(this.activeField) this.activeField.querySelector('.editable-label').innerText = val; }
    
    static updateHelp(val) {
        if(this.activeField) {
            const el = this.activeField.querySelector('.help-text');
            if(val.trim()) { el.innerText = val; el.style.display = 'block'; } 
            else { el.innerText = ''; el.style.display = 'none'; }
        }
    }

    static updatePlaceholder(val) {
        if(this.activeField) {
            const input = this.activeField.querySelector('.form-control');
            if(input) input.placeholder = val;
        }
    }

    static updateRequired(isChecked) {
        if(this.activeField) {
            isChecked ? this.activeField.classList.add('required-active') : this.activeField.classList.remove('required-active');
        }
    }

    static deleteActiveField() {
        if(this.activeField && confirm('Tem certeza que deseja excluir?')) {
            this.activeField.remove();
            this.renderSummary(); 
            const canvas = document.getElementById('formCanvas');
            if(canvas.querySelectorAll('.form-group').length === 0) {
                document.getElementById('emptyMsg').style.display = 'block';
            }
        }
    }

    static _translateType(type) {
        const dic = { 'text': 'Texto Curto', 'richtext': 'Texto Rico', 'date': 'Data', 'textarea': 'Área Texto', 'select': 'Seleção', 'file': 'Arquivo', 'header': 'Seção', 'radio': 'Radio' };
        return dic[type] || type;
    }

    static _renderOptionsManager(field) {
        const select = field.querySelector('select.main-select');
        let optionsHtml = '';
        Array.from(select.options).forEach((opt, idx) => {
            optionsHtml += `
                <li class="sidebar-opt-item">
                    ${opt.text}
                    <span class="sidebar-opt-remove" onclick="PropertiesPanel.removeOption(${idx})">✖</span>
                </li>`;
        });
        return `
            <div class="prop-group">
                <label class="prop-label">Gerenciar Opções</label>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="newOptInput" class="prop-input" placeholder="Nova opção..." onkeypress="if(event.key==='Enter') PropertiesPanel.addOption()">
                    <button class="btn-add-opt" onclick="PropertiesPanel.addOption()">+</button>
                </div>
                <ul class="sidebar-options-list">${optionsHtml}</ul>
            </div>
        `;
    }

    static addOption() {
        const input = document.getElementById('newOptInput');
        const text = input.value.trim();
        if(!text || !this.activeField) return;

        const select = this.activeField.querySelector('select.main-select');
        const opt = document.createElement('option');
        opt.text = text; opt.value = text;
        select.add(opt);

        const radioGroup = this.activeField.querySelector('.radio-preview-group');
        if(radioGroup) {
            const lbl = document.createElement('label');
            lbl.style.display = 'block'; lbl.style.marginBottom = '2px';
            lbl.innerHTML = `<input type="radio" disabled> ${text}`;
            radioGroup.appendChild(lbl);
        }
        this.render(this.activeField);
        setTimeout(() => document.getElementById('newOptInput').focus(), 50);
    }

    static removeOption(index) {
        if(!this.activeField) return;
        const select = this.activeField.querySelector('select.main-select');
        const textToRemove = select.options[index].text;
        select.remove(index);

        const radioGroup = this.activeField.querySelector('.radio-preview-group');
        if(radioGroup) {
            const labels = radioGroup.querySelectorAll('label');
            for(let lbl of labels) {
                if(lbl.innerText.trim() === textToRemove) { lbl.remove(); break; }
            }
        }
        this.render(this.activeField);
    }
}

/**
 * CLASSE 3: FORM CANVAS (GERENCIA O GRID)
 */
class FormCanvas {
    constructor(canvasId, emptyMsgId) {
        this.canvas = document.getElementById(canvasId);
        this.emptyMsg = document.getElementById(emptyMsgId);
        this._initEvents();
    }

    _initEvents() {
        this.canvas.addEventListener('dragover', (e) => this._handleDragOver(e));
        this.canvas.addEventListener('dragleave', () => this.canvas.classList.remove('drag-over'));
        this.canvas.addEventListener('drop', (e) => this._handleDrop(e));
        
        // Listener para atualizar o resumo
        this.canvas.addEventListener('input', (e) => {
            if (e.target.classList.contains('editable-label')) {
                if(!e.target.closest('.form-group.selected')) {
                    PropertiesPanel.renderSummary();
                }
            }
        });

        // Clique fora para deselecionar
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group') && !e.target.closest('.structure-sidebar')) {
                InteractionManager.deselectAll();
            }
        });
    }

    _handleDragOver(e) {
        e.preventDefault();
        this.canvas.classList.add('drag-over');
        const draggingItem = document.querySelector('.dragging');
        if (draggingItem) {
            const afterElement = this._getDragAfterElement(e.clientX, e.clientY);
            if (afterElement == null) this.canvas.appendChild(draggingItem);
            else this.canvas.insertBefore(draggingItem, afterElement);
        }
    }

    _handleDrop(e) {
        e.preventDefault();
        this.canvas.classList.remove('drag-over');
        if(this.emptyMsg) this.emptyMsg.style.display = 'none';

        const origin = e.dataTransfer.getData('origin');
        if (origin === 'sidebar') {
            const type = e.dataTransfer.getData('inputType');
            this.addComponent(type);
        } else {
            if(!PropertiesPanel.activeField) PropertiesPanel.renderSummary();
        }
    }

    // --- NOVA LÓGICA DE DETECÇÃO DE POSIÇÃO GRID/FLEX ---
    _getDragAfterElement(x, y) {
        const draggableElements = [...this.canvas.querySelectorAll('.form-group:not(.dragging)')];

        return draggableElements.find(child => {
            const box = child.getBoundingClientRect();

            // 1. Verifica se o mouse está na mesma linha vertical do elemento (com margem de erro)
            if (y >= box.top - 10 && y <= box.bottom + 10) {
                // 2. Se está na mesma linha, verifica se está à esquerda do centro horizontal
                if (x < box.left + box.width / 2) {
                    return true;
                }
            }
            
            // 3. Caso especial: Se o mouse está numa linha claramente acima do elemento atual
            // isso ajuda a inserir no final de uma linha anterior ou inicio da atual
            if (y < box.top - 15) {
                return true;
            }

            return false;
        });
    }

    addComponent(type) {
        const element = FieldFactory.create(type);
        this._addInternalDragEvents(element);
        this._makeResizable(element);
        this.canvas.appendChild(element);
        InteractionManager.selectField(null, element);
    }

    _addInternalDragEvents(item) {
        item.addEventListener('dragstart', (e) => {
            // Evita arrastar se clicar no input ou no resizer
            if (e.target.closest('.rich-content-area') || e.target.closest('input') || e.target.closest('.field-resizer') || e.target.closest('textarea')) {
                 e.preventDefault(); return;
            }
            e.dataTransfer.setData('origin', 'internal');
            setTimeout(() => item.classList.add('dragging'), 0);
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            if(!PropertiesPanel.activeField) PropertiesPanel.renderSummary();
        });
    }

    // --- REDIMENSIONAMENTO PARA FLEXBOX ---
    _makeResizable(element) {
        const resizer = element.querySelector('.field-resizer');
        
        // Headers são sempre 100%, não redimensionam
        if(element.getAttribute('data-field-type') === 'header') {
            resizer.style.display = 'none';
            return;
        }

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            
            const startX = e.clientX;
            const startWidth = element.getBoundingClientRect().width;
            const parentWidth = this.canvas.getBoundingClientRect().width;

            const doDrag = (e) => {
                let newWidth = startWidth + (e.clientX - startX);
                
                // Limites mínimos e máximos
                if (newWidth < 150) newWidth = 150; // Mínimo razoável
                if (newWidth > parentWidth - 40) newWidth = parentWidth - 40; // Máximo container

                element.style.width = `${newWidth}px`;
            };

            const stopDrag = () => { 
                window.removeEventListener('mousemove', doDrag); 
                window.removeEventListener('mouseup', stopDrag);
            };
            window.addEventListener('mousemove', doDrag); 
            window.addEventListener('mouseup', stopDrag);
        });
    }
}

/**
 * CLASSE 4: EXPORT MANAGER
 */
class ExportManager {
    static _getData() {
        const fields = document.querySelectorAll('#formCanvas .form-group');
        if (fields.length === 0) return null;

        return Array.from(fields).map((field, index) => {
            const type = field.getAttribute('data-field-type');
            const label = field.querySelector('.editable-label').innerText.trim().replace(/[\r\n\t"]+/g, " ");
            const helpEl = field.querySelector('.help-text');
            const helpText = helpEl ? helpEl.innerText.trim().replace(/[\r\n\t"]+/g, " ") : "";
            const required = field.classList.contains('required-active') ? 'Sim' : 'Não';
            let options = "";
            const select = field.querySelector('select.main-select');
            if (select && select.options.length > 0) {
                options = Array.from(select.options).map(o => o.text).join('; ');
            }
            return { index: index + 1, label, helpText, type, required, options };
        });
    }

    static downloadCSV() {
        const data = this._getData();
        if (!data) return alert("Formulário vazio!");
        let csv = "Ordem,Nome do Campo,Descrição/Ajuda,Tipo,Obrigatório,Opções\n";
        data.forEach(item => {
            csv += `${item.index},"${item.label}","${item.helpText}","${item.type}","${item.required}","${item.options}"\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "formulario.csv";
        link.click();
    }

    static copyToClipboard(btn) {
        const data = this._getData();
        if (!data) return alert("Formulário vazio!");
        let text = "Ordem\tNome do Campo\tDescrição/Ajuda\tTipo\tObrigatório\tOpções\n";
        data.forEach(item => {
            text += `${item.index}\t${item.label}\t${item.helpText}\t${item.type}\t${item.required}\t${item.options}\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
            const original = btn.innerText;
            btn.innerText = "✅ Copiado!";
            btn.style.backgroundColor = "#27ae60";
            setTimeout(() => {
                btn.innerText = original;
                btn.style.backgroundColor = "";
            }, 2000);
        });
    }
}

/**
 * CLASSE 5: INTERACTION MANAGER
 */
class InteractionManager {
    static selectField(event, element) {
        if(event) event.stopPropagation();
        document.querySelectorAll('.form-group.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        PropertiesPanel.render(element);
    }

    static deselectAll() {
        document.querySelectorAll('.form-group.selected').forEach(el => el.classList.remove('selected'));
        PropertiesPanel.renderSummary();
    }
}

// --- INICIALIZAÇÃO ---

const appCanvas = new FormCanvas('formCanvas', 'emptyMsg');

document.querySelectorAll('.draggable-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('inputType', item.getAttribute('data-type'));
        e.dataTransfer.setData('origin', 'sidebar');
    });
});

window.exportToCSV = () => ExportManager.downloadCSV();
window.copyToClipboard = (btn) => ExportManager.copyToClipboard(btn);
window.InteractionManager = InteractionManager;
window.PropertiesPanel = PropertiesPanel;

// Inicia mostrando o resumo
PropertiesPanel.renderSummary();