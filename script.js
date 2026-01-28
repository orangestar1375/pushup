document.addEventListener('DOMContentLoaded', () => {
    // Elements - Common
    const setsHistoryContainer = document.getElementById('sets-history');
    const scrollContainer = document.getElementById('number-scroll');
    const finishSetBtn = document.getElementById('finish-set-btn');

    // Elements - Session Management
    const finishSessionBtn = document.getElementById('finish-session-btn');
    const startNewSessionBtn = document.getElementById('start-new-session-btn');
    const resetSessionSmallBtn = document.getElementById('reset-session-small-btn');
    const summaryTotalEl = document.getElementById('final-total');
    const summaryListEl = document.getElementById('summary-history-list');

    // Views
    const views = {
        active: document.getElementById('active-session-view'),
        summary: document.getElementById('summary-view')
    };

    // Config
    const ITEM_HEIGHT = 60; // Must match CSS
    const MAX_PUSHUPS = 100;

    // State
    let currentCount = 0;
    let sets = [];

    // Initialize
    loadState();
    initPicker();
    renderHistory();


    // --- Picker Logic ---

    function initPicker() {
        // Add padding items so 0 and MAX can be centered
        const paddingCount = 1; // Number of empty items top/bottom to allow centering

        // 1. Top Padding
        for (let i = 0; i < paddingCount; i++) {
            const pad = document.createElement('li');
            pad.style.visibility = 'hidden';
            scrollContainer.appendChild(pad);
        }

        // 2. Numbers
        for (let i = 0; i <= MAX_PUSHUPS; i++) {
            const li = document.createElement('li');
            li.textContent = i;
            li.dataset.value = i;
            scrollContainer.appendChild(li);
        }

        // 3. Bottom Padding
        for (let i = 0; i < 3; i++) { // Extra padding for safe scrolling
            const pad = document.createElement('li');
            pad.style.visibility = 'hidden';
            scrollContainer.appendChild(pad);
        }

        // Scroll listener to detect selection
        scrollContainer.addEventListener('scroll', handleScroll);

        // Initial Scroll to saved state
        setTimeout(() => {
            scrollToValue(currentCount);
        }, 100);
    }

    let scrollTimeout;
    function handleScroll() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Find the center item
            const scrollTop = scrollContainer.scrollTop;
            const index = Math.round(scrollTop / ITEM_HEIGHT);

            // Update UI highlight
            updateActiveItem(index);

            // Update state
            currentCount = index;
            localStorage.setItem('pushupCurrent', currentCount);
        }, 50); // Debounce slightly
    }

    function updateActiveItem(index) {
        // The list shares padding, so index 0 in data is actual child index 1 (because of top padding)
        const items = scrollContainer.querySelectorAll('li');
        items.forEach(item => item.classList.remove('active'));

        const targetIndex = index + 1; // +1 for top padding
        if (items[targetIndex]) {
            items[targetIndex].classList.add('active');
        }
    }

    function scrollToValue(val) {
        if (val < 0) val = 0;
        if (val > MAX_PUSHUPS) val = MAX_PUSHUPS;

        // Scroll to position
        scrollContainer.scrollTop = val * ITEM_HEIGHT;
        updateActiveItem(val);
    }


    // --- Main Actions ---

    finishSetBtn.addEventListener('click', () => {
        if (currentCount > 0) {
            sets.push(currentCount);

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);

            // Save & Render
            saveState();
            renderHistory();
            scrollToBottom();
        }
    });

    finishSessionBtn.addEventListener('click', () => {
        if (sets.length === 0) {
            alert("Do some pushups first!");
            return;
        }
        showSummary();
    });

    startNewSessionBtn.addEventListener('click', () => {
        if (confirm('Start a fresh session?')) {
            startNewSession();
        }
    });

    if (resetSessionSmallBtn) {
        resetSessionSmallBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset this session? All progress will be lost.')) {
                startNewSession();
            }
        });
    }


    // --- Core Functions ---

    function showSummary() {
        // Switch Views, but check if elements exist first
        if (!views.active || !views.summary) return;

        views.active.classList.add('hidden');
        views.summary.classList.remove('hidden');

        // Populate Data
        let total = sets.reduce((a, b) => a + b, 0);
        if (summaryTotalEl) summaryTotalEl.textContent = total;

        // Populate Summary List (Clone rendering logic but for all items)
        if (summaryListEl) {
            summaryListEl.innerHTML = '';
            sets.forEach((count, index) => {
                const setEl = document.createElement('div');
                setEl.className = 'set-item';
                setEl.innerHTML = `
                    <span class="set-label">Set ${index + 1}</span>
                    <span class="set-count">${count}</span>
                `;
                summaryListEl.appendChild(setEl);
            });
        }
    }

    function startNewSession() {
        // Reset State
        sets = [];
        currentCount = 0;
        saveState();

        // Reset UI
        renderHistory(); // clear active list
        scrollToValue(0); // reset picker

        // Switch Views
        if (views.active && views.summary) {
            views.summary.classList.add('hidden');
            views.active.classList.remove('hidden');
        }
    }

    function renderHistory() {
        if (!setsHistoryContainer) return;

        setsHistoryContainer.innerHTML = '';
        let total = 0;

        // Calculate total from all sets
        sets.forEach(count => total += count);

        if (sets.length === 0) {
            setsHistoryContainer.innerHTML = '<div class="empty-state">No sets yet</div>';
        } else {
            // Only show last 3 sets
            const startIndex = Math.max(0, sets.length - 3);
            const visibleSets = sets.slice(startIndex);

            // Add indicator if sets are hidden
            if (startIndex > 0) {
                const hiddenEl = document.createElement('div');
                hiddenEl.className = 'empty-state'; // Reuse style for simplicity
                hiddenEl.style.marginTop = '0';
                hiddenEl.style.marginBottom = '0.5rem';
                hiddenEl.style.fontSize = '0.8rem';
                hiddenEl.textContent = `... ${startIndex} earlier sets hidden`;
                setsHistoryContainer.appendChild(hiddenEl);
            }

            visibleSets.forEach((count, i) => {
                const realIndex = startIndex + i;
                const setEl = document.createElement('div');
                setEl.className = 'set-item';
                setEl.innerHTML = `
                    <span class="set-label">Set ${realIndex + 1}</span>
                    <span class="set-count">${count}</span>
                `;
                setsHistoryContainer.appendChild(setEl);

                // Add slide-in animation specifically for the newest one
                if (realIndex === sets.length - 1) {
                    setEl.style.animation = 'slideIn 0.3s ease-out';
                } else {
                    setEl.style.animation = 'none'; // Prevent re-animating old ones on re-render
                }
            });
        }

        // Update Total Display
        const totalEl = document.getElementById('session-total');
        if (totalEl) {
            totalEl.textContent = total;
            // Simple animation
            totalEl.style.transform = 'scale(1.2)';
            setTimeout(() => totalEl.style.transform = 'scale(1)', 150);
        }
    }

    function saveState() {
        localStorage.setItem('pushupSets', JSON.stringify(sets));
        localStorage.setItem('pushupCurrent', currentCount);
    }

    function loadState() {
        const savedCurrent = localStorage.getItem('pushupCurrent');
        const savedSets = localStorage.getItem('pushupSets');

        if (savedCurrent) currentCount = parseInt(savedCurrent);
        if (savedSets) sets = JSON.parse(savedSets);
    }

    function scrollToBottom() {
        if (setsHistoryContainer) {
            setsHistoryContainer.scrollTop = setsHistoryContainer.scrollHeight;
        }
    }
});
