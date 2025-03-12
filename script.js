"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const checkboxContainer = document.querySelector('.checkbox-group');
    const resultsContainer = document.querySelector('.results-container');
    const themeToggle = document.getElementById('themeToggle');
    const vennDiagram = document.getElementById('vennDiagram');
    const addBtn = document.getElementById('addCheckbox');
    const removeBtn = document.getElementById('removeCheckbox');
    const exportBtn = document.getElementById('exportButton');
    const operations = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'];
    let checkboxes = [];
    let history = [];
    let results = {};

    function toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.textContent = isDark ? '🌞 Modo Claro' : '🌓 Modo Oscuro';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌞 Modo Claro' : '🌓 Modo Oscuro';
    themeToggle.addEventListener('click', toggleTheme);

    function createVennDiagram() {
        vennDiagram.innerHTML = `
            <defs>
                <clipPath id="intersection">
                    <path d="M50,100a50,50 0 0,1 50-50a50,50 0 0,1 0,100a50,50 0 0,1-50-50z"/>
                </clipPath>
            </defs>
            <circle cx="75" cy="100" r="50" fill="rgba(100, 100, 255, 0.3)" id="circle1"/>
            <circle cx="125" cy="100" r="50" fill="rgba(255, 100, 100, 0.3)" id="circle2"/>
            <rect x="75" y="50" width="50" height="100" fill="rgba(0, 255, 0, 0.3)" clip-path="url(#intersection)" id="intersectionArea"/>
        `;
    }

    function updateVisualization(values) {
        const [val1, val2] = values;
        document.getElementById('circle1').style.opacity = val1 ? 1 : 0.3;
        document.getElementById('circle2').style.opacity = val2 ? 1 : 0.3;
        document.getElementById('intersectionArea').style.opacity = (val1 && val2) ? 1 : 0.3;
    }

    function updateHistory(values, results) {
        const timestamp = new Date().toLocaleTimeString();
        history.unshift({
            time: timestamp,
            values: [...values],
            results: {...results}
        });
        
        history = history.slice(0, 5);
        
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = history.map(entry => `
            <li>
                [${entry.time}] 
                Casillas: ${entry.values.map(v => v ? '✓' : '✗').join(', ')} | 
                AND: ${entry.results.and ? '✓' : '✗'}
                OR: ${entry.results.or ? '✓' : '✗'}
            </li>
        `).join('');
    }

    function createCheckboxes(num) {
        checkboxContainer.innerHTML = '';
        checkboxes = [];
        for (let i = 1; i <= num; i++) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox${i}`;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` Casilla ${i}`));
            checkboxContainer.appendChild(label);
            checkboxes.push(checkbox);
        }
        checkboxes.forEach(cb => cb.addEventListener("change", calculateResults));
    }

    function createResults() {
        resultsContainer.innerHTML = '';
        
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'results';
        operations.forEach(op => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${op}:</strong> <span id="${op.toLowerCase()}Result">❌ False</span>`;
            resultsDiv.appendChild(p);
        });
        
        const historyDiv = document.createElement('div');
        historyDiv.className = 'history';
        historyDiv.innerHTML = `
            <h3>Historial (Últimas 5 operaciones):</h3>
            <ul id="historyList"></ul>
        `;
        
        resultsContainer.appendChild(resultsDiv);
        resultsContainer.appendChild(historyDiv);
    }

    function calculateResults() {
        const values = checkboxes.map(cb => cb.checked);
        results = {
            checkboxes: values,
            operations: {
                and: values.every(Boolean),
                or: values.some(Boolean),
                xor: values.filter(Boolean).length % 2 !== 0,
                nand: !values.every(Boolean),
                nor: !values.some(Boolean),
                xnor: values.filter(Boolean).length % 2 === 0
            }
        };

        updateVisualization(values);
        updateHistory(values, results.operations);

        Object.entries(results.operations).forEach(([op, result]) => {
            const element = document.getElementById(`${op}Result`);
            element.textContent = result ? "✅ True" : "❌ False";
            element.style.color = result ? "var(--result-true)" : "var(--result-false)";
        });
    }

    function exportResults() {
        const jsonString = JSON.stringify(results, null, 2);
        const csvString = convertToCSV(results);

        const exportOptions = document.createElement('div');
        exportOptions.innerHTML = `
            <button id="exportJSON">Exportar JSON</button>
            <button id="exportCSV">Exportar CSV</button>
        `;
        document.body.appendChild(exportOptions);

        document.getElementById('exportJSON').addEventListener('click', () => downloadFile(jsonString, 'resultados.json', 'application/json'));
        document.getElementById('exportCSV').addEventListener('click', () => downloadFile(csvString, 'resultados.csv', 'text/csv'));
    }

    function convertToCSV(results) {
        const headers = ['Casilla', 'Estado', ...operations];
        let csvContent = headers.join(',') + '\n';

        results.checkboxes.forEach((state, index) => {
            const row = [`Casilla ${index + 1}`, state ? 'Marcada' : 'No marcada'];
            operations.forEach(op => {
                row.push(results.operations[op.toLowerCase()] ? 'True' : 'False');
            });
            csvContent += row.join(',') + '\n';
        });

        return csvContent;
    }

    function downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }

    createVennDiagram();
    createCheckboxes(2);
    createResults();
    calculateResults();

    addBtn.addEventListener('click', () => {
        const newCount = checkboxes.length + 1;
        createCheckboxes(newCount);
        calculateResults();
    });

    removeBtn.addEventListener('click', () => {
        if (checkboxes.length > 1) {
            const newCount = checkboxes.length - 1;
            createCheckboxes(newCount);
            calculateResults();
        }
    });

    exportBtn.addEventListener('click', exportResults);

    function animateResults() {
        resultsContainer.querySelectorAll('p').forEach((p, index) => {
            p.style.transition = 'transform 0.3s ease';
            p.style.transform = 'scale(1.1)';
            setTimeout(() => {
                p.style.transform = 'scale(1)';
            }, 300 + index * 100);
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateResults();
            }
        });
    }, { threshold: 0.5 });

    observer.observe(resultsContainer);
});




