console.log("presentation.js loaded");

let presentationActive = false;
let presentationAbortController = null;
let presentationCompleted = false;
let continueButton = null;
let overlay = null;

// Make these accessible globally for main.js
window.presentationActive = false;
window.presentationCompleted = false;

const presentationBtn = document.getElementById("presentation-toggle");

// Create overlay on page load
function createOverlay() {
    if (overlay) return overlay;
    
    overlay = document.createElement('div');
    overlay.id = 'presentation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 3000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        text-align: center;
        color: #fff;
        max-width: 600px;
        padding: 40px;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'US Fire Distribution Analysis';
    title.style.cssText = `
        font-size: 2.5rem;
        margin-bottom: 20px;
        color: #ff6b35;
        font-weight: 700;
    `;
    
    const description = document.createElement('p');
    description.textContent = 'When people think of wildfires, they think of California. But in 2024, the most catastrophic wildfire didn\'t happen in California at all. Discover the surprising truth about wildfire risk in America.';
    description.style.cssText = `
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 40px;
        color: #ececec;
    `;
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Click to Start';
    startButton.style.cssText = `
        padding: 16px 48px;
        font-size: 1.3rem;
        font-weight: 600;
        background: linear-gradient(135deg, #ff6b35, #ff8c5a);
        color: #fff;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    `;
    
    startButton.addEventListener('mouseenter', () => {
        startButton.style.transform = 'scale(1.05)';
        startButton.style.boxShadow = '0 6px 25px rgba(255, 107, 53, 0.6)';
    });
    
    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'scale(1)';
        startButton.style.boxShadow = '0 4px 20px rgba(255, 107, 53, 0.4)';
    });
    
    startButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
        startPresentation();
    });
    
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(startButton);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    return overlay;
}

// Initialize overlay when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
} else {
    createOverlay();
}

// Create persistent left-side explanation text box
let explanationBox = null;
function createExplanationBox() {
    if (explanationBox) return explanationBox;
    
    explanationBox = document.createElement('div');
    explanationBox.id = 'explanation-box';
    explanationBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 24px;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        color: #fff;
        padding: 24px 28px;
        border-radius: 12px;
        font-size: 1rem;
        line-height: 1.7;
        max-width: 320px;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        border: 1px solid #333;
        max-height: 70vh;
        overflow-y: auto;
    `;
    document.body.appendChild(explanationBox);
    return explanationBox;
}

function showExplanation(text, showContinue = true) {
    const box = createExplanationBox();
    box.innerHTML = text;
    
    if (showContinue) {
        const button = document.createElement('button');
        button.textContent = 'Continue →';
        button.style.cssText = `
            margin-top: 16px;
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: 600;
            background: linear-gradient(135deg, #ff6b35, #ff8c5a);
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s, box-shadow 0.2s;
            font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        `;
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.02)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
        box.appendChild(button);
        continueButton = button;
    }
    
    box.style.opacity = '1';
    box.style.pointerEvents = 'auto';
}

function hideExplanation() {
    if (explanationBox) {
        explanationBox.style.opacity = '0';
        explanationBox.style.pointerEvents = 'none';
    }
}

if (!presentationBtn) {
    console.log("ERROR: #presentation-toggle button not found in DOM");
}

// toggle handler
presentationBtn.addEventListener("click", () => {
    console.log("Button clicked. presentationActive =", presentationActive);
    if (!presentationActive) {
        startPresentation();
    } else {
        stopPresentation();
    }
});

async function startPresentation() {
    console.log("START requested");

    if (presentationActive) {
        console.log("Ignored: presentation already active.");
        return;
    }

    presentationActive = true;
    window.presentationActive = true;
    presentationAbortController = new AbortController();
    console.log("Presentation ACTIVE. Abort controller created.");

    // Disable map interactions
    disableMapInteractions();

    // UI change
    presentationBtn.textContent = "⏹️";
    presentationBtn.classList.add("running");
    console.log("Button changed to STOP (⏹️)");

    // Show explanation box
    showExplanation("");

    try {
        await runSteps(presentationAbortController.signal);
        console.log("runSteps finished normally.");
        presentationCompleted = true;
        window.presentationCompleted = true;
    } catch (err) {
        console.log("runSteps terminated:", err);
    }

    // RESET STATE
    presentationActive = false;
    window.presentationActive = false;
    presentationAbortController = null;
    presentationBtn.textContent = "▶️";
    presentationBtn.classList.remove("running");
    hideExplanation();

    // Enable map interactions after presentation
    if (presentationCompleted) {
        enableMapInteractions();
    }

    console.log("Presentation reset to idle state. Button is ▶️ again.");
}

function stopPresentation() {
    console.log("STOP requested.");
    if (presentationAbortController) {
        console.log("Aborting presentation...");
        presentationAbortController.abort();
    } else {
        console.log("No abort controller — nothing to stop.");
    }
}

async function runSteps(signal) {
    // ========== AND: The Perception ==========
    // STEP 0: Introduction - Setting up the perception
    console.log("STEP 0: Introduction - AND");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">When People Think of Wildfires...</h3>
        <p>When people think of wildfires, they automatically think of California.</p>
        <p>The media thinks California. The public thinks of California.</p>
        <p>Let's examine why this perception exists.</p>
    `);
    await waitForContinue(signal);

    // STEP 1: National view showing California prominence
    console.log("STEP 1: US view - showing California");
    checkAbort(signal);
    updateMonthUI(8); // August - peak fire season
    drawUSView(8);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">National Fire Activity</h3>
        <p>Looking at the United States during peak fire season, California stands out prominently on the map.</p>
        <p>The state's high fire activity and media coverage have made it synonymous with wildfires in the public consciousness.</p>
    `);
    await waitForContinue(signal);

    // STEP 2: Zoom to California - the perception
    console.log("STEP 2: Zoom to California - AND");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">California: The Fire State</h3>
        <p>California's fire activity is undeniable. The state experiences devastating wildfires year after year, with extensive media coverage.</p>
        <p>This has shaped our collective understanding: wildfires = California.</p>
    `);
    await waitForContinue(signal);
    await zoomToState("06", "california");
    updateMonthUI(8);
    await waitForContinue(signal);

    // STEP 3: Show California's fire activity
    console.log("STEP 3: California fire activity");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">California's Fire Patterns</h3>
        <p>Here we see California's county-level fire distribution during peak season. The state's geography, climate, and vegetation make it highly susceptible to wildfires.</p>
        <p>This is what we expect. This is what we know. This is California.</p>
    `);
    await waitForContinue(signal);
    // Show peak summer months
    for (let m = 7; m <= 9; m++) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await waitForContinue(signal);
    }

    // ========== BUT: The Reality ==========
    // STEP 4: The twist - return to national view
    console.log("STEP 4: BUT - The Reality");
    checkAbort(signal);
    drawUSView(2); // February 2024 - when Smokehouse Creek Fire occurred
    updateMonthUI(2);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem; color: #ff6b35;">BUT...</h3>
        <p><strong>But in 2024, the most catastrophic wildfire didn't happen in California at all.</strong></p>
        <p>Let's look at February 2024, when something unexpected occurred.</p>
    `);
    await waitForContinue(signal);

    // STEP 5: Zoom to Texas - the reality
    console.log("STEP 5: Zoom to Texas - BUT");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">The Smokehouse Creek Fire</h3>
        <p>It happened in Texas, where the <strong>Smokehouse Creek Fire</strong> burned over a million acres — nearly the size of Delaware.</p>
        <p>This was the largest wildfire in Texas history and one of the most devastating fires of 2024.</p>
    `);
    await waitForContinue(signal);
    await zoomToState("48", "texas");
    updateMonthUI(2); // February 2024
    await waitForContinue(signal);

    // STEP 6: Show Texas during the Smokehouse Creek Fire
    console.log("STEP 6: Texas during Smokehouse Creek Fire");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">February 2024: Texas</h3>
        <p>Here we see Texas during February 2024, when the Smokehouse Creek Fire raged across the Panhandle region.</p>
        <p>This single fire burned more than 1 million acres, destroying homes, killing livestock, and devastating communities.</p>
    `);
    await waitForContinue(signal);
    // Show February and March (when the fire was most active)
    for (let m = 2; m <= 3; m++) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await waitForContinue(signal);
    }

    // STEP 7: Show Texas throughout the year
    console.log("STEP 7: Texas year-round");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Texas: A Year of Fire</h3>
        <p>Texas experiences significant fire activity throughout the year, not just during traditional "fire season."</p>
        <p>The state's size and diverse geography create fire risks that many people don't associate with Texas.</p>
    `);
    await waitForContinue(signal);
    // Show key months to demonstrate year-round activity
    const keyMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (let m of keyMonths) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await waitForContinue(signal);
    }

    // ========== THEREFORE: The Conclusion ==========
    // STEP 8: Return to national view - the conclusion
    console.log("STEP 8: THEREFORE - Conclusion");
    checkAbort(signal);
    drawUSView(8); // Show peak season
    updateMonthUI(8);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem; color: #ff6b35;">THEREFORE...</h3>
        <p><strong>Therefore, wildfire risk isn't a California problem. It's an American problem.</strong></p>
        <p>Wildfires affect states across the country, from California to Texas, from Oregon to Florida. The risk is national, and the response must be too.</p>
    `);
    await waitForContinue(signal);

    // STEP 9: Show different months to emphasize national scope
    console.log("STEP 9: National scope throughout the year");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">A National Challenge</h3>
        <p>As we cycle through the months, notice how different states show peak fire activity at different times.</p>
        <p>Wildfire risk varies by region, season, and climate, but it exists everywhere.</p>
    `);
    await waitForContinue(signal);
    // Show different months to demonstrate national scope
    const monthsToShow = [2, 4, 6, 8, 10, 12];
    for (let m of monthsToShow) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawUSView(m);
        await waitForContinue(signal);
    }

    // STEP 10: Final conclusion
    console.log("STEP 10: Final conclusion");
    checkAbort(signal);
    drawUSView(8);
    updateMonthUI(8);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">The Takeaway</h3>
        <p>When we think of wildfires, we think of California. But the data tells a different story.</p>
        <p>In 2024, the most catastrophic fire happened in Texas. Wildfire risk is not confined to one state—it's a challenge that spans the entire nation.</p>
        <p style="margin-top: 16px; font-weight: 600; color: #ff6b35;">You can now explore the map on your own!</p>
    `);
    await waitForContinue(signal);

    console.log("All steps complete.");
}

// Wait for user click instead of sleep
function waitForContinue(signal) {
    return new Promise((resolve, reject) => {
        const button = explanationBox?.querySelector('button');
        if (!button) {
            // If no button, resolve immediately (for steps that don't need continuation)
            resolve();
            return;
        }
        
        const clickHandler = () => {
            button.removeEventListener('click', clickHandler);
            signal.removeEventListener('abort', abortHandler);
            resolve();
        };
        
        const abortHandler = () => {
            button.removeEventListener('click', clickHandler);
            signal.removeEventListener('abort', abortHandler);
            reject("aborted");
        };
        
        button.addEventListener('click', clickHandler);
        signal.addEventListener("abort", abortHandler);
    });
}

function checkAbort(signal) {
    if (signal.aborted) {
        console.log("ABORT detected.");
        throw "aborted";
    }
}

function updateMonthUI(monthNum) {
    monthRangeBottom.value = monthNum;
    monthLabelBottom.textContent = MONTHS[monthNum - 1];

    console.log("UI month updated:", MONTHS[monthNum - 1]);
}

// Disable map interactions during presentation
function disableMapInteractions() {
    const states = document.querySelectorAll('.state');
    const counties = document.querySelectorAll('.county');
    const monthSlider = document.getElementById('month-range-bottom');
    const backButton = document.getElementById('back-us');
    
    states.forEach(state => {
        state.style.pointerEvents = 'none';
        state.style.cursor = 'default';
    });
    
    counties.forEach(county => {
        county.style.pointerEvents = 'none';
        county.style.cursor = 'default';
    });
    
    if (monthSlider) {
        monthSlider.disabled = true;
        monthSlider.style.opacity = '0.5';
        monthSlider.style.cursor = 'not-allowed';
    }
    
    if (backButton) {
        backButton.style.pointerEvents = 'none';
        backButton.style.opacity = '0.5';
        backButton.style.cursor = 'not-allowed';
    }
}

// Enable map interactions after presentation
function enableMapInteractions() {
    const states = document.querySelectorAll('.state');
    const counties = document.querySelectorAll('.county');
    const monthSlider = document.getElementById('month-range-bottom');
    const backButton = document.getElementById('back-us');
    
    states.forEach(state => {
        state.style.pointerEvents = 'auto';
        state.style.cursor = 'pointer';
    });
    
    counties.forEach(county => {
        county.style.pointerEvents = 'auto';
        county.style.cursor = 'pointer';
    });
    
    if (monthSlider) {
        monthSlider.disabled = false;
        monthSlider.style.opacity = '1';
        monthSlider.style.cursor = 'pointer';
    }
    
    if (backButton) {
        backButton.style.pointerEvents = 'auto';
        backButton.style.opacity = '1';
        backButton.style.cursor = 'pointer';
    }
}