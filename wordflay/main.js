const excerpt = document.querySelector('textarea');
const distribution = document.querySelector('tbody');
let ascending = true;
let displacing = false;
let endpoint = 0;
let invocation = 0;
let scheduled = null;

function analyze() {
    const input = excerpt.value;
    const words = input.toLowerCase().match(/[\p{L}\p{N}]+(?:\S[\p{L}\p{N}]+)*/gu) || [];
    const glossary = new Map();
    let repeatCount = 0;

    for (const word of words) {
        const freq = (glossary.get(word) || 0) + 1;

        glossary.set(word, freq);

        if (freq > 1)
            repeatCount++;
    }

    const repeatPercentage = Math.round((repeatCount / words.length) * 10000) / 100 || 0;
    const sentences = (input.match(/[.?!]\s+|\n+/g) || []).length;
    const rating = Math.round(((words.length / Math.max(sentences, 1) - 17) / 34 + 0.5) * 100) / 100;
    const readingTime = Math.ceil((words.length / 238) + (sentences / 120));

    document.getElementById('ratio').textContent = repeatPercentage + "%";
    document.getElementById('complexity').textContent = rating;
    document.getElementById('temporality').textContent = readingTime + " min";
    document.getElementById('phrases').textContent = sentences;
    document.getElementById('words').textContent = words.length;
    document.getElementById('letters').textContent = input.length;

    const sortedWords = [...glossary.entries()].sort((a, b) => b[1] - a[1]);
    let rows = "";

    for (const [word, freq] of sortedWords) {
        const relevance = word.length * freq;
        const percentage = Math.round((relevance / input.length) * 10000) / 100;

        rows += `<tr><td>${word}</td><td>${freq}</td><td>${word.length}</td><td>${relevance}</td><td>${percentage}%</td></tr>`;
    }

    distribution.innerHTML = rows;
}

function kflay() {
    const now = Date.now();
    const elapsed = now - invocation;

    invocation = now;

    if (elapsed > 1000) {
        analyze();
    } else {
        clearTimeout(scheduled);

        scheduled = setTimeout(analyze, 1000 - elapsed);
    }
}

window.addEventListener('load', () => {
    document.querySelector('thead').addEventListener('click', (event) => {
        if (event.target.tagName !== 'TH')
            return;

        const cellIndex = event.target.cellIndex;
        const rows = Array.from(distribution.rows);

        if (cellIndex === 0) {
            rows.sort((tr1, tr2) => {
                const tr1Text = tr1.cells[cellIndex].textContent;
                const tr2Text = tr2.cells[cellIndex].textContent;

                return ascending ? tr1Text.localeCompare(tr2Text) : tr2Text.localeCompare(tr1Text);
            });
        } else {
            rows.sort((tr1, tr2) => {
                const tr1Data = parseFloat(tr1.cells[cellIndex].textContent);
                const tr2Data = parseFloat(tr2.cells[cellIndex].textContent);

                return ascending ? tr1Data - tr2Data : tr2Data - tr1Data;
            });
        }

        ascending = !ascending;
        distribution.append(...rows);
    });

    excerpt.addEventListener('input', kflay);

    document.querySelector('resize-bar').addEventListener('mousedown', (e) => {
        displacing = true;
        endpoint = e.clientY;
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        displacing = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!displacing)
            return;

        const deltaY = e.clientY - endpoint;
        const newHeight = excerpt.offsetHeight + deltaY;

        excerpt.style.height = newHeight + 'px';
        endpoint = e.clientY;
    });

    window.addEventListener('beforeunload', (e) => {
        if (excerpt.value !== "")
            e.returnValue = "";
    });
});