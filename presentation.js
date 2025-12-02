console.log("presentation.js loaded");

let presentationActive = false;
let presentationAbortController = null;

const presentationBtn = document.getElementById("presentation-toggle");

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

function showExplanation(text) {
    const box = createExplanationBox();
    box.innerHTML = text;
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
    presentationAbortController = new AbortController();
    console.log("Presentation ACTIVE. Abort controller created.");

    // UI change
    presentationBtn.textContent = "⏹️";
    presentationBtn.classList.add("running");
    console.log("Button changed to STOP (⏹️)");

    // Show explanation box
    showExplanation("");

    try {
        await runSteps(presentationAbortController.signal);
        console.log("runSteps finished normally.");
    } catch (err) {
        console.log("runSteps terminated:", err);
    }

    // RESET STATE
    presentationActive = false;
    presentationAbortController = null;
    presentationBtn.textContent = "▶️";
    presentationBtn.classList.remove("running");
    hideExplanation();

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
    // STEP 0: Introduction
    console.log("STEP 0: Introduction");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Fire Distribution Analysis</h3>
        <p>This presentation explores fire distribution across the United States in 2024. We'll examine three key states: California, Oregon, and Texas, to understand regional fire patterns throughout the year.</p>
        <p>The map shows fire intensity using Fire Radiative Power (FRP) data, with darker colors indicating higher fire activity.</p>
    `);
    await sleep(3000, signal);

    // STEP 1: US view
    console.log("STEP 1: US view month 1");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">National Overview</h3>
        <p>We start with a view of the entire United States. Each state is colored based on its total Fire Radiative Power (FRP) for the selected month.</p>
        <p>Notice the regional patterns - some states show consistently higher fire activity than others.</p>
    `);
    updateMonthUI(1);
    drawUSView(1);
    await sleep(1500, signal);

    // STEP 2: Zoom to California
    console.log("STEP 2: Zoom to California");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">California Fire Patterns</h3>
        <p>California is one of the most fire-prone states in the US. We're now zooming into California to examine county-level fire distribution.</p>
        <p>Watch how fire activity varies across different counties and throughout the year.</p>
    `);
    await zoomToState("06", "california");
    updateMonthUI(6);
    await sleep(2000, signal);

    // STEP 3: Monthly playback for California
    console.log("STEP 3: Monthly playback for California");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">California: Year in Review</h3>
        <p>Now we'll cycle through all 12 months to see how fire activity changes throughout the year in California.</p>
        <p>Notice the seasonal patterns - fire activity typically peaks during the summer and fall months when conditions are driest.</p>
    `);
    for (let m = 1; m <= 12; m++) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await sleep(350, signal);
    }

    // STEP 4: Zoom back to US
    console.log("STEP 4: Zoom back to US");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Returning to National View</h3>
        <p>We're zooming back out to the national view. California showed significant fire activity, especially in certain counties.</p>
        <p>Next, we'll examine Oregon, another state with notable fire patterns.</p>
    `);
    drawUSView(1);
    updateMonthUI(1);
    await sleep(1500, signal);

    // STEP 5: Zoom to Oregon
    console.log("STEP 5: Zoom to Oregon");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Oregon Fire Patterns</h3>
        <p>Oregon, located in the Pacific Northwest, experiences significant wildfire activity, particularly in its forested regions.</p>
        <p>We're now examining Oregon's county-level fire distribution to understand regional variations.</p>
    `);
    await zoomToState("41", "oregon");
    updateMonthUI(6);
    await sleep(2000, signal);

    // STEP 6: Monthly playback for Oregon
    console.log("STEP 6: Monthly playback for Oregon");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Oregon: Year in Review</h3>
        <p>Cycling through all 12 months for Oregon. Compare the seasonal patterns here with what we saw in California.</p>
        <p>Notice how different regions within Oregon show varying fire activity levels throughout the year.</p>
    `);
    for (let m = 1; m <= 12; m++) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await sleep(350, signal);
    }

    // STEP 7: Zoom back to US
    console.log("STEP 7: Zoom back to US");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Returning to National View</h3>
        <p>Back to the national overview. Oregon showed distinct fire patterns, often concentrated in specific regions.</p>
        <p>Finally, we'll examine Texas, which has a different fire profile due to its size and diverse geography.</p>
    `);
    drawUSView(1);
    updateMonthUI(1);
    await sleep(1500, signal);

    // STEP 8: Zoom to Texas
    console.log("STEP 8: Zoom to Texas");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Texas Fire Patterns</h3>
        <p>Texas is the second-largest state and has diverse fire patterns across its many counties.</p>
        <p>Due to its size and varied climate zones, Texas shows different fire characteristics compared to California and Oregon.</p>
    `);
    await zoomToState("48", "texas");
    updateMonthUI(6);
    await sleep(2000, signal);

    // STEP 9: Monthly playback for Texas
    console.log("STEP 9: Monthly playback for Texas");
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Texas: Year in Review</h3>
        <p>Examining all 12 months for Texas. Notice the geographic distribution of fires across this large state.</p>
        <p>Different regions of Texas may show peak fire activity at different times of the year.</p>
    `);
    for (let m = 1; m <= 12; m++) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await sleep(350, signal);
    }

    // STEP 10: Zoom back to US
    console.log("STEP 10: Zoom back to US");
    checkAbort(signal);
    showExplanation(`
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.3rem;">Conclusion</h3>
        <p>We've examined fire patterns in three key states: California, Oregon, and Texas.</p>
        <p>Each state shows unique fire characteristics based on geography, climate, and land use. Understanding these patterns helps in fire management and prevention strategies.</p>
    `);
    drawUSView(1);
    updateMonthUI(1);
    await sleep(1500, signal);

    console.log("All steps complete.");
}

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            resolve();
        }, ms);

        signal.addEventListener("abort", () => {
            clearTimeout(id);
            reject("aborted");
        });
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