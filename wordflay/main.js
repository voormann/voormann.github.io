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

    for (const word of words)
        glossary.set(word, (glossary.get(word) || 0) + 1);

    const repeatPercentage = Math.round((1 - (glossary.size / words.length)) * 10000) / 100 || 0;
    const sentences = (input.match(/[.?!]\s+|\n+/g) || []).length;
    const rating = Math.round(((words.length / Math.max(sentences, 1) - 17) / 34 + 0.5) * 100) / 100;
    const readingTime = Math.ceil(words.length / 200);

    document.getElementById('ratio').textContent = `${repeatPercentage}%`;
    document.getElementById('complexity').textContent = rating;
    document.getElementById('temporality').textContent = formatTime(readingTime);
    document.getElementById('phrases').textContent = formatNumber(sentences);
    document.getElementById('words').textContent = formatNumber(words.length);
    document.getElementById('letters').textContent = formatNumber(input.length);

    const sortedWords = [...glossary.entries()].sort((a, b) => b[1] - a[1]);
    let rows = "";

    for (const [word, freq] of sortedWords) {
        const relevance = word.length * freq;
        const percentage = Math.round((relevance / input.length) * 10000) / 100;

        rows += `<tr><td>${word}</td><td>${freq}</td><td>${word.length}</td><td>${relevance} (${percentage}%)</td></tr>`;
    }

    distribution.innerHTML = rows;
}

function formatNumber(numbah) {
    const str = numbah.toString();
    let result = "";
    let count = 0;

    for (let i = str.length - 1; i >= 0; i--) {
        result = str[i] + result;
        count++;

        if (count % 3 === 0 && i !== 0)
            result = " " + result;
    }

    return result;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        if (remainingMinutes === 0) {
            return `${hours} hr`;
        } else {
            return `${hours} hr ${remainingMinutes} min`;
        }
    } else {
        return `${remainingMinutes} min`;
    }
}

function kflay() {
    const now = Date.now();
    const elapsed = now - invocation;

    invocation = now;

    if (elapsed > 500) {
        analyze();
    } else {
        clearTimeout(scheduled);

        scheduled = setTimeout(analyze, 500);
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
                const tr1Data = parseInt(tr1.cells[cellIndex].textContent);
                const tr2Data = parseInt(tr2.cells[cellIndex].textContent);

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