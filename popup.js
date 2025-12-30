document.addEventListener('DOMContentLoaded', function () {
    const filterBtn = document.getElementById('filter-btn');
    const copyBtn = document.getElementById('copy-btn');
    const lengthInput = document.getElementById('wordlength');
    const resultContainer = document.getElementById('result-container');

    filterBtn.addEventListener('click', function () {
        const length = parseInt(lengthInput.value);
        if (isNaN(length) || length < 1) {
            resultContainer.innerHTML = '<p class="empty-message">Please enter a valid number.</p>';
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getWords", length: length }, function (response) {
                if (chrome.runtime.lastError) {
                    resultContainer.innerHTML = '<p class="empty-message">Error connecting to page. Refresh the page and try again.</p>';
                    console.error(chrome.runtime.lastError);
                    return;
                }

                if (response && response.words) {
                    displayResults(response.words);
                } else {
                    resultContainer.innerHTML = '<p class="empty-message">No words found.</p>';
                }
            });
        });
    });

    copyBtn.addEventListener('click', function () {
        const words = [];
        document.querySelectorAll('#result-container li').forEach(li => {
            words.push(li.textContent);
        });

        if (words.length > 0) {
            navigator.clipboard.writeText(words.join('\n')).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 1500);
            });
        }
    });

    function displayResults(words) {
        resultContainer.innerHTML = '';
        if (words.length === 0) {
            resultContainer.innerHTML = '<p class="empty-message">No words found with that length.</p>';
            copyBtn.style.display = 'none';
        } else {
            const ul = document.createElement('ul');
            words.forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                ul.appendChild(li);
            });
            resultContainer.appendChild(ul);
            copyBtn.style.display = 'block';
        }
    }
});
