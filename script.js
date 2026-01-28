document.addEventListener('DOMContentLoaded', () => {
    const scrollContainer = document.getElementById('number-scroll');
    const finishSetBtn = document.getElementById('finish-set-btn');
    const resetSessionBtn = document.getElementById('reset-session-btn');
    const setsHistoryContainer = document.getElementById('sets-history');

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
            // Note: We don't save to localStorage on every scroll to avoid spam, 
            // but we could if needed. For now, saving on 'Log Set' is safer?
            // Actually, usability wise, saving current selection is good.
            localStorage.setItem('pushupCurrent', currentCount);
        }, 50); // Debounce slightly
    }

    function updateActiveItem(index) {
        // The list shares padding, so index 0 in data is actual child index 1 (because of top padding)
        // Children: [Pad, 0, 1, 2, ...]
        // Target is child[index + 1]

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

            // Optional: Reset picker to 0 or keep typical number?
            // Usually keeping it is nice, but user might want to reset?
            // Let's reset to a "ready" state, maybe Keep it as is for repitition,
            // or reset to 0. Let's keep it, allows rapid logging of same reps.
        }
    });

    resetSessionBtn.addEventListener('click', () => {
        if (confirm('Start a new session?')) {
            sets = [];
            currentCount = 0;
            saveState();
            renderHistory();
            scrollToValue(0); // Reset picker
        }
    });

    // --- Core Functions ---

    function renderHistory() {
        setsHistoryContainer.innerHTML = '';
        let total = 0;

        if (sets.length === 0) {
            setsHistoryContainer.innerHTML = '<div class="empty-state">No sets yet</div>';
        } else {
            sets.forEach((count, index) => {
                total += count;
                const setEl = document.createElement('div');
                setEl.className = 'set-item';
                setEl.innerHTML = `
                    <span class="set-label">Set ${index + 1}</span>
                    <span class="set-count">${count}</span>
                `;
                setsHistoryContainer.appendChild(setEl);
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
        setsHistoryContainer.scrollTop = setsHistoryContainer.scrollHeight;
    }
});
