// DOM Elements shared references
let modalOverlay = null;
let collectedWords = []; // In-memory cache of what we have
let isAutoMode = false;

// HTML Template for the Modal
const modalHTML = `
<div id="domcheck-modal-header">
    <h2 id="domcheck-modal-title">Wordstract</h2>
    <div style="display:flex; gap:10px; align-items:center;">
        <button id="domcheck-minimize-btn" style="border:none; background:none; cursor:pointer; font-weight:bold; color:#555;">_</button>
        <button id="domcheck-close-btn">&times;</button>
    </div>
</div>
<div id="domcheck-modal-body">
    <div class="domcheck-toggle-container">
        <span class="domcheck-toggle-label">Auto Navigation Mode</span>
        <label class="domcheck-switch">
             <input type="checkbox" id="domcheck-auto-toggle">
             <span class="domcheck-slider"></span>
        </label>
    </div>
    
    <div class="domcheck-control-group" style="flex-direction: column; align-items: flex-start;">
        <label style="font-size: 12px; margin-bottom: 5px; font-weight: 600;">Select Lengths:</label>
        <div id="domcheck-length-options" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;"><input type="checkbox" class="domcheck-len-cb" value="3"> 3</label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;"><input type="checkbox" class="domcheck-len-cb" value="4"> 4</label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;"><input type="checkbox" class="domcheck-len-cb" value="5"> 5</label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;"><input type="checkbox" class="domcheck-len-cb" value="6"> 6</label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;"><input type="checkbox" class="domcheck-len-cb" value="7"> 7</label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;"><input type="checkbox" class="domcheck-len-cb" value="8"> 8</label>
        </div>
        <button id="domcheck-scan-btn" class="domcheck-btn" style="width: 100%;">Scan Page</button>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;">
        <span style="font-size:12px; font-weight:600;">Results</span>
        <div style="display:flex; gap:4px;">
            <button id="domcheck-copy-btn" class="domcheck-btn domcheck-btn-success" style="padding:4px 8px; font-size:12px;">Copy List</button>
            <button id="domcheck-clear-btn" class="domcheck-btn domcheck-btn-secondary" style="padding:4px 8px; font-size:12px;">Clear List</button>
        </div>
    </div>

    <ul id="domcheck-results"></ul>
</div>
`;

// Initialize
function init() {
    console.log("DomCheck: Initializing...");
    try {
        createModal();

        // 1. global preferences (Words, Lengths) -> Local Storage
        chrome.storage.local.get(['collectedWords', 'selectedLengths'], (result) => {
            if (result.collectedWords) {
                collectedWords = result.collectedWords;
                updateUI();
            }
            const lengthsToSelect = result.selectedLengths && result.selectedLengths.length > 0 ? result.selectedLengths : [5];
            updateCheckboxState(lengthsToSelect);

            // 2. Auto Mode State -> Session Storage (Tab Isolated)
            // We check this AFTER loading lengths so we can pass them to runAutoMode
            const autoState = sessionStorage.getItem('domcheck_isAutoMode');
            if (autoState === 'true') {
                isAutoMode = true;
                const toggle = document.getElementById('domcheck-auto-toggle');
                if (toggle) {
                    toggle.checked = true;
                }
                runAutoMode(lengthsToSelect);
            }
        });

    } catch (err) {
        console.error("DomCheck: Initialization error", err);
    }
}

function createModal() {
    if (document.getElementById('domcheck-modal-overlay')) return;

    if (!document.body) {
        // Fallback or retry if body isn't ready, though run_at idle usually guarantees it
        setTimeout(createModal, 100);
        return;
    }

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'domcheck-modal-overlay';

    // Check session early to decide visibility
    // If auto mode is ON, we generally want to see the modal to know what's happening
    // or keep it unobtrusive. User said "modal always on top".
    // Let's default to hidden unless auto-mode is ON.
    const autoState = sessionStorage.getItem('domcheck_isAutoMode');
    if (autoState !== 'true') {
        modalOverlay.className = 'hidden';
    } else {
        modalOverlay.className = '';
    }

    modalOverlay.innerHTML = modalHTML;
    document.body.appendChild(modalOverlay);

    // Event Listeners with null checks
    const closeBtn = document.getElementById('domcheck-close-btn');
    const minimizeBtn = document.getElementById('domcheck-minimize-btn');
    const scanBtn = document.getElementById('domcheck-scan-btn');
    const clearBtn = document.getElementById('domcheck-clear-btn');
    const copyBtn = document.getElementById('domcheck-copy-btn');
    const autoToggle = document.getElementById('domcheck-auto-toggle');
    const checkboxes = document.querySelectorAll('.domcheck-len-cb');

    if (closeBtn) closeBtn.addEventListener('click', toggleModal);
    if (minimizeBtn) minimizeBtn.addEventListener('click', toggleMinimize);
    if (scanBtn) scanBtn.addEventListener('click', handleManualScan);
    if (clearBtn) clearBtn.addEventListener('click', clearData);
    if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
    if (autoToggle) autoToggle.addEventListener('change', toggleAutoMode);

    // Save preferences on checkbox change
    checkboxes.forEach(cb => {
        cb.addEventListener('change', savePreferences);
    });

    console.log("DomCheck: Modal created successfully.");
}

function toggleModal() {
    if (!modalOverlay) createModal();
    if (modalOverlay) {
        modalOverlay.classList.toggle('hidden');
    }
}

function toggleMinimize() {
    // Basic minimize implementation - toggle body visibility
    const body = document.getElementById('domcheck-modal-body');
    if (body) {
        body.style.display = body.style.display === 'none' ? 'block' : 'none';

        // Update minimize button text?
        const btn = document.getElementById('domcheck-minimize-btn');
        if (btn) btn.textContent = body.style.display === 'none' ? '+' : '_';
    }
}

// State Management

function savePreferences() {
    const selected = getSelectedLengths();
    chrome.storage.local.set({ selectedLengths: selected });
}

function updateCheckboxState(lengths) {
    const checkboxes = document.querySelectorAll('.domcheck-len-cb');
    checkboxes.forEach(cb => {
        cb.checked = lengths.includes(parseInt(cb.value));
    });
}

function getSelectedLengths() {
    const checkboxes = document.querySelectorAll('.domcheck-len-cb');
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selected.push(parseInt(cb.value));
        }
    });
    // Default to 5 if user unchecks all (prevent empty scan)
    if (selected.length === 0) return [5];
    return selected;
}

function saveData() {
    chrome.storage.local.set({ collectedWords: collectedWords });
}

function clearData() {
    collectedWords = [];
    saveData();
    updateUI();
}

function copyToClipboard() {
    if (collectedWords.length === 0) return;

    const textToCopy = collectedWords.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtn = document.getElementById('domcheck-copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('domcheck-btn-copied');

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('domcheck-btn-copied');
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function updateUI() {
    const list = document.getElementById('domcheck-results');
    list.innerHTML = '';
    collectedWords.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        list.appendChild(li);
    });
}

// Logic
function handleManualScan() {
    const lengths = getSelectedLengths();
    // Also save preferences when manually scanning, just in case
    savePreferences();
    scanPage(lengths);
}

// Normalization Helper
function normalizeWord(word) {
    let lower = word.toLowerCase();
    // Turkish replacements
    // ç -> c
    // ğ -> g
    // ı -> i
    // ö -> o
    // ş -> s
    // ü -> u
    // The input might have been uppercase, so toLowerCase handles Ç->ç etc.
    // But verify special cases like 'İ' -> 'i' (standard toLowerCase handles 'İ' -> 'i' in modern browsers but ensure it)

    return lower
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u');
}

function scanPage(lengths) {
    const newWords = getWordsByLengths(lengths);
    if (newWords.length > 0) {
        // Merge without duplicates (using normalized versions)
        newWords.forEach(w => {
            const normalized = normalizeWord(w);
            // Check existence against checks AND normalized check
            // Actually, we store normalized words now?
            // "Türkçe karakterleri ve diğerlerini ingilizce karakterlere dönüştürelim"
            // So we should STORE the normalized version.

            const exists = collectedWords.includes(normalized);
            if (!exists) {
                collectedWords.push(normalized);
            }
        });
        saveData();
        updateUI();
    }
}

function getWordsByLengths(lengths) {
    // Reusing existing logic but refined
    const textNodes = [];
    function getTextNodes(node) {
        if (node.nodeType === 3) {
            textNodes.push(node);
        } else {
            for (let child of node.childNodes) {
                // Skip script/style and our Own modal
                if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child.id !== 'domcheck-modal-overlay') {
                    getTextNodes(child);
                }
            }
        }
    }
    getTextNodes(document.body);

    const wordSet = new Set();

    // Construct a regex that matches any of the selected lengths

    // Use the full Turkish char class for detection
    const charClass = "[a-zA-ZçğıöşüÇĞİÖŞÜ]";
    // Create alternatives: [chars]{3}|[chars]{5}
    const alternatives = lengths.map(len => `${charClass}{${len}}`).join('|');
    const regex = new RegExp(`\\b(?:${alternatives})\\b`, 'g');

    textNodes.forEach(node => {
        const text = node.nodeValue;
        if (text) {
            const matches = text.match(regex);
            if (matches) {
                matches.forEach(word => {
                    wordSet.add(word); // Add original found string temporarily
                });
            }
        }
    });

    // We return original words here, normalization happens in scanPage
    // OR we normalize here to return a clean list?
    // Let's keep this returning raw findings, but maybe de-dupe raw findings first?
    const foundWords = Array.from(wordSet);
    return foundWords;
}

// Auto Mode
function toggleAutoMode(e) {
    isAutoMode = e.target.checked;

    // SAVE TO SESSION STORAGE (Tab Isolation)
    try {
        sessionStorage.setItem('domcheck_isAutoMode', isAutoMode);
    } catch (e) { console.error("SessionStorage failed", e); }

    // Also save current length prefs if enabling
    if (isAutoMode) {
        savePreferences();
        const lengths = getSelectedLengths();
        runAutoMode(lengths);
    }
}

function runAutoMode(lengths = null) {
    console.log("DomCheck: Auto Mode Active");

    // If lengths not passed (e.g. from somewhere else), read from DOM/Preferences
    if (!lengths) {
        lengths = getSelectedLengths();
    }

    // Slight delay to ensure page load logic is settled
    setTimeout(() => {
        scanPage(lengths);

        // 2. Navigate
        const links = Array.from(document.querySelectorAll('a[href]'))
            .filter(a => {
                try {
                    const url = new URL(a.href);
                    // Internal links only to stay safe
                    return url.hostname === window.location.hostname && !url.href.includes('#');
                } catch (err) { return false; }
            });

        if (links.length > 0) {
            const randomLink = links[Math.floor(Math.random() * links.length)];
            console.log("DomCheck: Navigating to", randomLink.href);

            // Navigate after 3 seconds
            setTimeout(() => {
                // Re-check state from variable (updated by toggle)
                if (isAutoMode) {
                    window.location.href = randomLink.href;
                }
            }, 3000);
        } else {
            console.log("DomCheck: No suitable links found to wander.");
        }
    }, 1000);
}

// Message Listener from Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleModal') {
        toggleModal();
        sendResponse({ success: true }); // Respond to avoid runtime.lastError issues
    }
});

// Run Init
if (document.body) {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
