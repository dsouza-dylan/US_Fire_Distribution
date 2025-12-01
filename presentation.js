console.log("presentation.js loaded");

let presentationActive = false;
let presentationAbortController = null;

const presentationBtn = document.getElementById("presentation-toggle");

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

    console.log("STEP 1: US view month 1");
    checkAbort(signal);
    updateMonthUI(1);
    drawUSView(1);
    await sleep(1500, signal);

    console.log("STEP 2: Zoom to California");
    checkAbort(signal);
    await zoomToState("06", "california");
    updateMonthUI(6);
    await sleep(2000, signal);

    console.log("STEP 3: Monthly playback");
    for (let m = 1; m <= 12; m++) {
        console.log("  – month", m);
        checkAbort(signal);
        updateMonthUI(m);
        drawCountyHeatmap(m);
        await sleep(350, signal);
    }

    console.log("STEP 4: Zoom back to US");
    checkAbort(signal);
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