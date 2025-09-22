let excelData = [];
let columns = [];

// Colunas fixas DIMENSION para a ferramenta
const toolColumns = [
    "DIMENSION['vendor_account_identifier']", "DIMENSION['vendor_account_name']", "DIMENSION['account_identifier']",
    "DIMENSION['account_name']", "DIMENSION['architecture']", "DIMENSION['attached_instance_id']",
    "DIMENSION['availability_zone']", "DIMENSION['compute_usage_type']", "DIMENSION['cost_adjustment_description']",
    "DIMENSION['date']", "DIMENSION['day']", "DIMENSION['day_of_week']", "DIMENSION['days_since_launch']",
    "DIMENSION['dns_name']", "DIMENSION['engine']", "DIMENSION['enhanced_service_name']", "DIMENSION['hour']",
    "DIMENSION['image']", "DIMENSION['instance_category']", "DIMENSION['instance_family']",
    "DIMENSION['instance_identifier']", "DIMENSION['instance_name']", "DIMENSION['instance_size']",
    "DIMENSION['instance_state']", "DIMENSION['instance_type']", "DIMENSION['invoice_date']", "DIMENSION['invoice_id']",
    "DIMENSION['ip_address']", "DIMENSION['item_description']", "DIMENSION['launch_date']", "DIMENSION['launch_day']",
    "DIMENSION['launch_day_of_week']", "DIMENSION['launch_month']", "DIMENSION['launch_time']",
    "DIMENSION['launch_week']", "DIMENSION['launch_year']", "DIMENSION['lease_type']", "DIMENSION['month']",
    "DIMENSION['multi_az']", "DIMENSION['offering_class']", "DIMENSION['operating_system']", "DIMENSION['operation']",
    "DIMENSION['private_dns_name']", "DIMENSION['private_ip_address']", "DIMENSION['product_name']",
    "DIMENSION['region']", "DIMENSION['region_zone']", "DIMENSION['reservation_identifier']",
    "DIMENSION['resource_identifier']", "DIMENSION['security_group_id']", "DIMENSION['security_group_name']",
    "DIMENSION['seller']", "DIMENSION['service_account_id']", "DIMENSION['service_name']", "DIMENSION['storage_type']",
    "DIMENSION['subnet']", "DIMENSION['tenancy']", "DIMENSION['transaction_type']", "DIMENSION['usage_family']",
    "DIMENSION['usage_type']", "DIMENSION['vendor']", "DIMENSION['virtualization_type']", "DIMENSION['vpc_id']",
    "DIMENSION['week']", "DIMENSION['year']", "DIMENSION['year_month']", "DIMENSION['year_week']"
];

// Upload CSV/XLSX
document.getElementById('dataFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const filename = file.name.toLowerCase();

    if (filename.endsWith('.csv')) {
        reader.onload = function(evt) {
            const csvText = evt.target.result;
            const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            excelData = parsed.data;
            columns = Object.keys(excelData[0] || {});
            initFase2();
        };
        reader.readAsText(file);
    } else {
        reader.onload = function(evt) {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            excelData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            columns = Object.keys(excelData[0] || {});
            initFase2();
        };
        reader.readAsArrayBuffer(file);
    }
});

function initFase2() {
    const valueSelect2 = document.getElementById('valueCol2');
    valueSelect2.innerHTML = '';
    columns.forEach(c => {
        valueSelect2.innerHTML += `<option value="${c}">${c}</option>`;
    });
    document.getElementById('configSection2').style.display = 'block';
    document.getElementById('statementsContainer').innerHTML = '';
    // Adiciona o primeiro statement automaticamente
    addStatement();
}

// ======================================================================
// Funções de gerenciamento dos Statements, Groups e Conditions
// ======================================================================

function addStatement() {
    const container = document.getElementById('statementsContainer');
    
    // Verifica se já existe um statement
    if (container.children.length > 0) {
        return; // Não faz nada se já houver um
    }
    
    const statementDiv = document.createElement('div');
    statementDiv.classList.add('card', 'statement-card');
    
    // Nome do Statement
    const statementCount = container.children.length + 1;
    const statementName = `Statement ${statementCount}`;
    
    statementDiv.innerHTML = `
        <div class="card-header handle">
            <input type="text" class="card-title-input" value="${statementName}" style="display:none;">
        </div>
        <div class="groups-container"></div>
        <button class="btn-secondary btn-small" style="margin-top: 10px;" onclick="addGroup(this)">
            <i class="fas fa-plus"></i> Add Operator (AND)
        </button>
    `;
    container.appendChild(statementDiv);
    addGroup(statementDiv.querySelector('.groups-container'));

}

function removeStatement(iconElement) {
    const statementCard = iconElement.closest('.statement-card');
    statementCard.remove();
    
    // Se não houver mais statements, reativa o botão
    if (document.getElementById('statementsContainer').children.length === 0) {
        document.querySelector('.header-actions .btn-primary').disabled = false;
    }
}

function addGroup(buttonElement) {
    const groupsContainer = buttonElement.closest('.statement-card').querySelector('.groups-container');
    const groupDiv = document.createElement('div');
    groupDiv.classList.add('group-container');
    
    groupDiv.innerHTML = `
        <div class="group-header">
            <label>Statement</label>
            <i class="fas fa-trash-alt" onclick="removeGroup(this)"></i>
        </div>
        <div class="conditions-container"></div>
        <button class="btn-secondary btn-small" onclick="addCondition(this)">
            <i class="fas fa-plus"></i> Add Operator (OR)
        </button>
    `;
    groupsContainer.appendChild(groupDiv);
    addCondition(groupDiv.querySelector('.conditions-container'));
}

function removeGroup(iconElement) {
    iconElement.closest('.group-container').remove();
}

function addCondition(buttonElement) {
    const conditionsContainer = buttonElement.closest('.group-container').querySelector('.conditions-container');
    const conditionDiv = document.createElement('div');
    conditionDiv.classList.add('condition');

    conditionDiv.addEventListener('click', function() {
        selectCondition(this);
    });

    const toolColSelect = createToolSelect();
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.placeholder = "Ex: Resource group";
    customInput.style.display = 'none';
    toolColSelect.addEventListener('change', () => {
        customInput.style.display = toolColSelect.value.endsWith('_CUSTOM') ? 'inline-block' : 'none';
    });

    const opSelect = createOperatorSelect();
    const fileColSelect = createFileSelect();
    
    const removeBtn = document.createElement('i');
    removeBtn.classList.add('fas', 'fa-trash-alt');
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.marginLeft = '10px';
    removeBtn.onclick = () => conditionDiv.remove();

    conditionDiv.appendChild(toolColSelect);
    conditionDiv.appendChild(customInput);
    conditionDiv.appendChild(opSelect);
    conditionDiv.appendChild(fileColSelect);
    conditionDiv.appendChild(removeBtn);

    conditionsContainer.appendChild(conditionDiv);
}

// Funções para criar os selects dinamicamente
function createToolSelect() {
    const toolColSelect = document.createElement('select');
    toolColSelect.className = 'toolColSelect';
    toolColumns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.text = c;
        toolColSelect.appendChild(opt);
    });
    const customOptions = ["ACCOUNT_GROUP", "TAG", "BUSINESS_DIMENSION"];
    customOptions.forEach(optName => {
        const opt = document.createElement('option');
        opt.value = optName + '_CUSTOM';
        opt.text = optName + "[...]";
        toolColSelect.appendChild(opt);
    });
    return toolColSelect;
}

function createOperatorSelect() {
    const opSelect = document.createElement('select');
    opSelect.className = 'opSelect';
    ['==', '!=', '!exists', 'exists', 'contains', '!contains', 'STARTS_WITH', '!STARTS_WITH', 'ENDS_WITH','!ENDS_WITH', '>', '<', '>=', '<='].forEach(op => {
        const opt = document.createElement('option');
        opt.value = op;
        opt.text = op;
        opSelect.appendChild(opt);
    });
    return opSelect;
}

function createFileSelect() {
    const fileColSelect = document.createElement('select');
    fileColSelect.className = 'fileColSelect';
    columns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.text = c;
        fileColSelect.appendChild(opt);
    });
    return fileColSelect;
}

// ======================================================================
// Geração do JSON
// ======================================================================

function generateJSON2() {
    const jsonNameInput = document.getElementById('jsonName');
    const jsonDefaultInput = document.getElementById('jsonDefault');

    if (jsonNameInput.value.trim() === '') {
        alert('O campo "Name" é obrigatório.');
        jsonNameInput.focus();
        return;
    }

    if (jsonDefaultInput.value.trim() === '') {
        alert('O campo "Valor padrão" é obrigatório.');
        jsonDefaultInput.focus();
        return;
    }
    
    // Pega o único statement na tela
    const statementCard = document.querySelector('.statement-card');
    if (!statementCard) {
        alert('Nenhum statement encontrado para gerar o JSON.');
        return;
    }
    const groups = Array.from(statementCard.querySelectorAll('.group-container')).map(groupDiv => {
        const conditions = Array.from(groupDiv.querySelectorAll('.condition')).map(conditionDiv => {
            const toolColSelect = conditionDiv.querySelector('.toolColSelect');
            const customInput = conditionDiv.querySelector('input[type="text"]');
            const toolCol = toolColSelect.value.endsWith('_CUSTOM') ? `${toolColSelect.value.replace('_CUSTOM', '')}['${customInput.value}']` : toolColSelect.value;
            const fileCol = conditionDiv.querySelector('.fileColSelect').value;
            const operator = conditionDiv.querySelector('.opSelect').value;
            
            return { toolCol, fileCol, operator };
        });
        return { conditions };
    });

    const valueCol = document.getElementById('valueCol2').value;
    const jsonName = document.getElementById('jsonName').value || "Unnamed";
    const defaultValue = document.getElementById('jsonDefault').value || "(not set)";

    const jsonStatements = excelData.map(row => {
        let matchExpression = '';
        
        groups.forEach((group, groupIndex) => {
            let groupExpression = group.conditions.map(cond => {
                let expr = '';
                switch (cond.operator) {
                    case '==': expr = `${cond.toolCol} == '${row[cond.fileCol]}'`; break;
                    case '!=': expr = `${cond.toolCol} != '${row[cond.fileCol]}'`; break;
                    case '!exists': expr = `${cond.toolCol} !exists`; break;
                    case 'exists': expr = `${cond.toolCol} exists`; break;
                    case 'contains': expr = `'${row[cond.fileCol]}' in ${cond.toolCol}`; break;
                    case '!contains': expr = `'${row[cond.fileCol]}' not in ${cond.toolCol}`; break;
                    case 'STARTS_WITH': expr = `STARTS_WITH(${cond.toolCol}, '${row[cond.fileCol]}')`; break;
                    case '!STARTS_WITH': expr = `!STARTS_WITH(${cond.toolCol}, '${row[cond.fileCol]}')`; break;
                    case 'ENDS_WITH': expr = `ENDS_WITH(${cond.toolCol}, '${row[cond.fileCol]}')`; break;
                    case '!ENDS_WITH': expr = `!ENDS_WITH(${cond.toolCol}, '${row[cond.fileCol]}')`; break;
                    case '>': expr = `${cond.toolCol} > ${row[cond.fileCol]}`; break;
                    case '<': expr = `${cond.toolCol} < ${row[cond.fileCol]}`; break;
                    case '>=': expr = `${cond.toolCol} >= ${row[cond.fileCol]}`; break;
                    case '<=': expr = `${cond.toolCol} <= ${row[cond.fileCol]}`; break;
                }
                return expr;
            }).join(' || ');
            
            if (groups.length > 1 && groupIndex > 0) {
                matchExpression += ' && ';
            }
            
            if (groups.length > 1) {
                matchExpression += `(${groupExpression})`;
            } else {
                matchExpression += groupExpression;
            }
        });

        return {
            matchExpression: matchExpression,
            valueExpression: `'${row[valueCol]}'`
        };
    });

    const jsonData = {
        name: jsonName,
        kind: "BUSINESS_DIMENSION",
        defaultValue: defaultValue,
        statements: jsonStatements
    };

    showJSON(jsonData);
}

// ======================================================================
// Funções Auxiliares
// ======================================================================

function resetPage() {
    document.getElementById('dataFile').value = '';
    document.getElementById('configSection2').style.display = 'none';
    document.getElementById('statementsContainer').innerHTML = '';
    document.getElementById('valueCol2').innerHTML = '';
    document.getElementById('output').textContent = '';
    excelData = [];
    columns = [];
    document.getElementById('downloadBtn').style.display = 'none';
}

function updateStatementName(element) {
    if (!element.innerText.trim()) {
        element.innerText = 'Statement';
    }
}

// Exibir JSON e baixar
function showJSON(jsonData) {
    const outputEl = document.getElementById('output');
    outputEl.textContent = JSON.stringify(jsonData, null, 2);

    const downloadBtn = document.getElementById('downloadBtn');
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.getElementById('jsonName').value || 'output'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

function selectCondition(element) {
    // Remove a classe 'selected' de todos os elementos 'condition'
    const conditions = document.querySelectorAll('.condition');
    conditions.forEach(c => c.classList.remove('selected'));

    // Adiciona a classe 'selected' ao elemento clicado
    element.classList.add('selected');
}

// Inicializar a funcionalidade de reordenação com Sortable.js
document.addEventListener('DOMContentLoaded', () => {
    const statementsContainer = document.getElementById('statementsContainer');
    new Sortable(statementsContainer, {
        animation: 150,
        handle: '.handle', // Apenas a área de cabeçalho do card pode ser usada para arrastar
    });
});



