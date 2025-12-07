console.log("presentation.js loaded");

let presentationActive = false;
let presentationAbortController = null;
let presentationCompleted = false;
let continueButton = null;
let overlay = null;
let explanationBox = null;

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
        max-width: 900px;
        padding: 40px;
    `;

    const title = document.createElement('h2');
    title.textContent = 'America on Fire: Visualizing Wildfires';
    title.style.cssText = `
        font-size: 2.5rem;
        margin-bottom: 20px;
        color: #ff6b35;
        font-weight: 700;
    `;

    const description = document.createElement('p');
    description.textContent = 'Discover the surprising truths about wildfire risk across the United States.';
    description.style.cssText = `
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 40px;
        color: #ececec;
    `;

    const startButton = document.createElement('button');
    startButton.textContent = 'Dive In';
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
        setTimeout(() => { overlay.style.display = 'none'; }, 500);
        startPresentation();
    });

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(startButton);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    return overlay;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createOverlay();
        preloadStateData();
    });
} else {
    createOverlay();
    preloadStateData();
}


async function preloadStateData() {
    console.log("Preloading state data...");
    const states = ["california", "texas", "oregon"]; // or use FIPS: ["06", "48", "41"]
    
    await Promise.all(states.map(async (state) => {
        try {
            await loadCountyData(state);
            console.log(`${state} data preloaded.`);
        } catch (e) {
            console.error(`Failed to preload ${state}:`, e);
        }
    }));
    
    console.log("Preload complete!");
}

const countyDataCache = {}; // global cache

async function loadCountyData(stateId) {
    const cacheKey = stateId.toLowerCase();
    
    // Return cached data immediately
    if (countyDataCache[cacheKey]) {
        console.log(`Using cached data for ${stateId}`);
        return countyDataCache[cacheKey];
    }
    
    console.log(`Loading ${stateId} data...`);
    const data = await fetch(`/path/to/${stateId}-data.json`).then(r => r.json());
    
    // Cache it
    countyDataCache[cacheKey] = data;
    return data;
}

// =====================
// Explanation box
// =====================
function createExplanationBox() {
    if (explanationBox) return explanationBox;

    explanationBox = document.createElement('div');
    explanationBox.id = 'explanation-box';
    document.body.appendChild(explanationBox);
    return explanationBox;
}

// =====================
// Blank US page helper - full-page overlay
// =====================
// =====================
// Blank US page helper - full-page overlay
// =====================
// =====================
// Blank US page helper - full-page overlay
// =====================
function showBlankUSPage(line1, line2 = "", keywords = ["fire"]) {
    if (typeof drawUSView === "function") {
        drawUSView(); // redraw full US map
    }

    const box = createExplanationBox();
    box.innerHTML = ""; // clear previous content

    // Full-page style for US slides
    box.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(8px);
        z-index: 3000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #fff;
        padding: 0;
        opacity: 1;
        pointer-events: auto;
        transition: opacity 9s ease;
    `;

    const container = document.createElement("div");
    container.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 0 20px;
    `;

    // Helper function to highlight keywords
    function highlightKeywords(text, keywords) {
        let escaped = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&'); // escape regex chars
        keywords.forEach(word => {
            const regex = new RegExp(`(${word})`, "gi");
            escaped = escaped.replace(regex, `<span style="color:#ff6b35">$1</span>`);
        });
        return escaped;
    }

    const heading1 = document.createElement("h1");
    heading1.innerHTML = highlightKeywords(line1, keywords);
    heading1.style.cssText = `
        font-size: 3rem;
        color: #fff; /* default white */
        margin: 0 0 20px 0;
        line-height: 1.2;
        opacity: 0;
        transition: opacity 3s ease;
        text-align: left;
        margin-right: 20%; /* indent first line left */
    `;

    const heading2 = document.createElement("h1");
    heading2.innerHTML = highlightKeywords(line2, keywords);
    heading2.style.cssText = `
        font-size: 3rem;
        color: #fff;
        margin: 0 0 40px 0;
        line-height: 1.2;
        opacity: 0;
        transition: opacity 3s ease;
        text-align: right;
        margin-left: 20%; /* indent second line right */
    `;

    // Animate fade-in
    setTimeout(() => heading1.style.opacity = 1, 200);
    if (line2) setTimeout(() => heading2.style.opacity = 1, 1500);

    const button = document.createElement("button");
    button.innerHTML = `
        <span class="button-text">Continue →</span>
        <span class="button-spinner" style="display: none;">
            <div class="spinner-circle"></div>
        </span>
    `;
    button.style.cssText = `
        padding: 16px 48px;
        font-size: 1.3rem;
        font-weight: 600;
        background: linear-gradient(135deg, #ff6b35, #ff8c5a);
        color: #fff;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);
        transition: transform 0.2s, box-shadow 0.2s, opacity 0.5s ease;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        margin: 0;
        opacity: 0;
        pointer-events: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 200px;
    `;

    // Add spinner animation if not already added
    if (!document.querySelector('style[data-spinner-animation]')) {
        const style = document.createElement('style');
        style.setAttribute('data-spinner-animation', 'true');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .spinner-circle {
                width: 24px;
                height: 24px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }

    button.addEventListener('mouseenter', () => {
        if (button.dataset.loading !== 'true') {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 6px 25px rgba(255, 107, 53, 0.6)';
        }
    });
    button.addEventListener('mouseleave', () => {
        if (button.dataset.loading !== 'true') {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 20px rgba(255, 107, 53, 0.4)';
        }
    });

    // Store reference to button for click handler
    button.addEventListener('click', () => {
        const textSpan = button.querySelector('.button-text');
        const spinnerSpan = button.querySelector('.button-spinner');
        
        // Show spinner, hide text
        button.dataset.loading = 'true';
        button.style.pointerEvents = 'none';
        button.style.cursor = 'wait';
        textSpan.style.display = 'none';
        spinnerSpan.style.display = 'inline-block';
    });

    setTimeout(() => {
        button.style.opacity = 1;
        button.style.pointerEvents = 'auto';
    }, 2500);

    container.appendChild(heading1);
    if (line2) container.appendChild(heading2);
    container.appendChild(button);
    box.appendChild(container);
}




// =====================
// Zoom page helper - small centered popup
// =====================
// =====================
// Zoom page helper - small popup
// =====================
// Animate California months before enabling Continue
// Animate California months and update map
// Animate California months and update map visualization

function updateCaliforniaMonth(monthIndex) {
    if (!currentStateData.length) return; // ensure state is loaded
    drawCountyHeatmap(monthIndex + 1);    // monthIndex is 0-based
}

function animateCaliforniaMonths(signal) {
    return new Promise(async (resolve) => {

        // Months to animate (but NOT displayed)
        const months = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const delay = 700;

        const monthSlider = document.getElementById("month-range-bottom");

        for (let i = 0; i < months.length; i++) {
            if (signal.aborted) return;

            // Convert index → actual month number
            const monthNumber = i + 6; // Jun=6

            // Update map
            drawCountyHeatmap(monthNumber);

            // Update slider + label if they exist
            if (monthSlider) {
                monthSlider.value = monthNumber;
                monthSlider.dispatchEvent(new Event("input"));

                const monthLabelBottom = document.getElementById("month-label-bottom");
                if (monthLabelBottom) {
                    monthLabelBottom.textContent = MONTHS[monthNumber - 1];
                }
            }

            await new Promise((r) => setTimeout(r, delay));
        }

        resolve();
    });
}

function updateOregonMonth(monthIndex) {
    if (!currentStateData.length) return; // ensure state is loaded
    drawCountyHeatmap(monthIndex + 1);    // monthIndex is 0-based
}

function animateOregonMonths(signal) {
    return new Promise(async (resolve) => {

        // Months to animate (but NOT displayed)
        const months = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const delay = 700;

        const monthSlider = document.getElementById("month-range-bottom");

        for (let i = 0; i < months.length; i++) {
            if (signal.aborted) return;

            // Convert index → actual month number
            const monthNumber = i + 6; // Jun=6

            // Update map
            drawCountyHeatmap(monthNumber);

            // Update slider + label if they exist
            if (monthSlider) {
                monthSlider.value = monthNumber;
                monthSlider.dispatchEvent(new Event("input"));

                const monthLabelBottom = document.getElementById("month-label-bottom");
                if (monthLabelBottom) {
                    monthLabelBottom.textContent = MONTHS[monthNumber - 1];
                }
            }

            await new Promise((r) => setTimeout(r, delay));
        }

        resolve();
    });
}

function showMonthScroller() {
    let scroller = document.getElementById("month-scroller");
    if (!scroller) {
        scroller = document.createElement("div");
        scroller.id = "month-scroller";
        scroller.style.position = "absolute";
        scroller.style.bottom = "100px"; 
        scroller.style.left = "50%";
        scroller.style.transform = "translateX(-50%)";
        scroller.style.color = "#fff";
        scroller.style.fontSize = "2rem";
        scroller.style.fontWeight = "600";
        scroller.style.letterSpacing = "2px";
        scroller.style.pointerEvents = "none";
        overlay.appendChild(scroller);
    }
    scroller.textContent = MONTHS[currentMonthIndex];
    scroller.style.display = "block";
}


async function typewriterEffect(element, text, delay = 50) {
    element.textContent = ""; // clear previous text
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await new Promise(r => setTimeout(r, delay));
    }
}

function showZoomPage(stateName, title, description, buttonDelay = 4000) {
    const box = createExplanationBox();

    // Base HTML for title and description
    box.innerHTML = `
        <h2 id="zoom-title" style="margin-top:0; font-size:1.8rem; color:#ff6b35; opacity:0; transition: opacity 1s ease;">${title}</h2>
        <p id="zoom-desc" style="color:#fff; margin-bottom:20px; opacity:0; transition: opacity 1s ease;">${description}</p>
        ${stateName.toLowerCase() === "texas" ? `
        <img id="zoom-image" src="texas_smokehouse_creek.jpg" alt="Smokehouse Creek Fire" style="width:100%; max-width:300px; border-radius:8px; margin:20px 0; opacity:0; transition: opacity 1s ease;">
        ` : ""}
        <button id="zoom-continue-btn">Continue →</button>
    `;

    const titleEl = document.getElementById("zoom-title");
    const descEl = document.getElementById("zoom-desc");
    const button = document.getElementById("zoom-continue-btn");
    const imageEl = document.getElementById("zoom-image");

    // Fade in title and description sequentially
    setTimeout(() => titleEl.style.opacity = 1, 200);
    setTimeout(() => descEl.style.opacity = 1, 1000);

    // Fade in image (if exists) after description
    if (imageEl) {
        setTimeout(() => imageEl.style.opacity = 1, 2000);
    }

    // Style the Continue button
    button.style.cssText = `
        padding: 16px 48px;
        font-size: 1.3rem;
        font-weight: 600;
        background: linear-gradient(135deg, #ff6b35, #ff8c5a);
        color: #fff;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);
        transition: transform 0.2s, box-shadow 0.2s, opacity 0.5s ease;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        opacity: 0;
        pointer-events: none;
        margin-top: 20px;
    `;

    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 25px rgba(255, 107, 53, 0.6)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 20px rgba(255, 107, 53, 0.4)';
    });

    // Fade in button after everything else
    setTimeout(() => {
        button.style.opacity = 1;
        button.style.pointerEvents = 'auto';
    }, buttonDelay); // slightly later than image

    if (presentationActive) {
        box.style.cssText = `
            position: fixed;
            top: 50%;
            left: 25%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            color: #fff;
            padding: 32px 40px;
            border-radius: 12px;
            font-size: 1.1rem;
            line-height: 1.7;
            max-width: 500px;
            z-index: 2000;
            opacity: 1;
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: opacity 0.5s ease;
        `;
    }
}




// Hide explanation box
function hideExplanation() {
    if (explanationBox) {
        explanationBox.style.opacity = '0';
        explanationBox.style.pointerEvents = 'none';
    }
}

// Presentation start/stop
if (!presentationBtn) console.log("ERROR: #presentation-toggle not found");

presentationBtn.addEventListener("click", () => {
    if (!presentationActive) startPresentation();
    else stopPresentation();
});

async function startPresentation() {
    if (presentationActive) return;

    presentationActive = true;
    window.presentationActive = true;
    presentationAbortController = new AbortController();

    document.body.classList.add('presentation-mode');
    disableMapInteractions();
    presentationBtn.textContent = "⏹️";
    presentationBtn.classList.add("running");

    try {
        await runSteps(presentationAbortController.signal);
        presentationCompleted = true;
        window.presentationCompleted = true;
    } catch (err) {
        console.log("Presentation aborted:", err);
    }

    presentationActive = false;
    window.presentationActive = false;
    presentationAbortController = null;
    presentationBtn.textContent = "▶️";
    presentationBtn.classList.remove("running");
    hideExplanation();
    document.body.classList.remove('presentation-mode');
    if (presentationCompleted) enableMapInteractions();
}

function stopPresentation() {
    if (presentationAbortController) presentationAbortController.abort();
}

// =====================
// Presentation Steps
// =====================
function showSmallSquares() {
    const box = createExplanationBox();  // reuse global box
    box.innerHTML = `
        <h2 style="
            color:#ff6b35;
            font-size:1.8rem;
            margin-bottom:20px;
            text-align:center;
        ">
            Smokehouse Creek Fire: Burned Acres
        </h2>

        <div id="grid-container" style="
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            gap: 5px;
            width: 40%;
            margin: 0 auto;
        "></div>

        <div id="scale-info" style="
            color:#fff;
            margin-top:20px;
            font-size:1.5rem;
            text-align:center;
            font-weight:600;
            opacity:0;
            transition: opacity 1s ease;
        ">
            Each box represents not 1, but 10,000 acres of land.
        </div>

        <!-- CONSISTENT CONTINUE BUTTON -->
        <button id="small-squares-continue" style="
            margin-top:30px;
            padding:16px 48px;
            font-size:1.3rem;
            font-weight:600;
            background:linear-gradient(135deg, #ff6b35, #ff8c5a);
            color:#fff;
            border:none;
            border-radius:999px;
            cursor:pointer;
            box-shadow:0 4px 20px rgba(255,107,53,0.4);
            transition:transform 0.2s, box-shadow 0.2s, opacity 0.5s ease;
            font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
            opacity:0;
            pointer-events:none;
        ">
            Continue →
        </button>
    `;

    const gridContainer = document.getElementById('grid-container');
    const scaleInfo = document.getElementById('scale-info');
    const continueBtn = document.getElementById('small-squares-continue');

    // -----------------------------
    // Animate the 100 squares
    // -----------------------------
    for (let i = 0; i < 100; i++) {
        const sq = document.createElement('div');
        sq.style.cssText = `
            width: 40px;
            height: 40px;
            background: #ff6b35;
            border-radius: 4px;
            opacity: 0;
            transform: scale(0.8);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        gridContainer.appendChild(sq);

        setTimeout(() => {
            sq.style.opacity = '1';
            sq.style.transform = 'scale(1)';
        }, i * 60);
    }

    // -----------------------------
    // Delay the scale text and button
    // -----------------------------
    const totalDelay = 100 * 60 + 400; // animation time + buffer

    setTimeout(() => {
        scaleInfo.style.opacity = 1;

        // fade in the button AFTER text
        setTimeout(() => {
            continueBtn.style.opacity = 1;
            continueBtn.style.pointerEvents = "auto";
        }, 900);
    }, totalDelay);

    // -----------------------------
    // Hover animations
    // -----------------------------
    continueBtn.addEventListener('mouseenter', () => {
        continueBtn.style.transform = 'scale(1.05)';
        continueBtn.style.boxShadow = '0 6px 25px rgba(255,107,53,0.6)';
    });

    continueBtn.addEventListener('mouseleave', () => {
        continueBtn.style.transform = 'scale(1)';
        continueBtn.style.boxShadow = '0 4px 20px rgba(255,107,53,0.4)';
    });

    // -----------------------------
    // Return promise that resolves on click
    // -----------------------------
    return new Promise(resolve => {
        setTimeout(() => {
            continueBtn.addEventListener('click', () => resolve(), { once: true });
        }, totalDelay + 900);
    });
}




function showExploratoryPrompt(line1, line2 = "", keywords = ["default"]) {
    const box = createExplanationBox();
    box.innerHTML = ""; // clear old content

    box.style.cssText = "";

    function highlightKeywords(text, keywords) {
        let escaped = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&');
        keywords.forEach(word => {
            const regex = new RegExp(`(${word})`, "gi");
            escaped = escaped.replace(regex, `<span style="color:#ff6b35">$1</span>`);
        });
        return escaped;
    }

    const h1 = document.createElement("div");
    h1.innerHTML = highlightKeywords(line1, keywords);
    h1.style.fontSize = "1.8rem";
    const h2 = document.createElement("div");
    h2.innerHTML = highlightKeywords(line2, keywords);
    h2.style.marginTop = "10px";
    h2.style.fontSize = "1.2rem";
    h2.style.fontWeight = "400";

    box.appendChild(h1);
    if (line2) box.appendChild(h2);

    // Fade in
    requestAnimationFrame(() => {
        box.style.opacity = 1;
    });
}


async function runSteps(signal) {
    showBlankUSPage("When we think fire...", "... we think California.", ["fire", "California"]);
    await waitForContinue(signal);

    await zoomToState("06", "california");
    showZoomPage(
        "California",
        "California: The Fire State",
        "Year after year, California’s landscapes are transformed by fire. From the Santa Ana winds to parched forests, when people think of wildfires, they typically think of California.",
        4500
    );

    // Disable Continue button until months animation finishes
    const continueBtn = document.getElementById("zoom-continue-btn");
    continueBtn.style.opacity = 0;
    continueBtn.style.pointerEvents = "none";

    // Animate months first
    await animateCaliforniaMonths(presentationAbortController.signal);

    // Enable Continue button after timeline
    continueBtn.style.opacity = 1;
    continueBtn.style.pointerEvents = "auto";
    await waitForContinue(signal);

    showBlankUSPage("But the largest fire of 2024...", "... was NOT in California.", ["largest", "NOT"]);
    await waitForContinue(signal);

    await zoomToState("48", "texas");
    if (typeof drawCountyHeatmap === "function") {
        drawCountyHeatmap(2);
    }
    const monthSlider = document.getElementById("month-range-bottom");
    if (monthSlider) {
        monthSlider.value = 2;
        monthSlider.dispatchEvent(new Event('input'));
        const monthLabelBottom = document.getElementById('month-label-bottom');
        if (monthLabelBottom) monthLabelBottom.textContent = "Feb";
    }
    showZoomPage(
        "Texas",
        "Trouble in Texas",
        "Texas' Smokehouse Creek Fire burned over a million acres, making it the largest wildfire in Texas history.",
        3000
    );
    await waitForContinue(signal);

    showBlankUSPage(
        "Over 1 million acres burned...",
        "... imagine each as a small square.",
        ["1 million acres", "small square"]
    );
    await waitForContinue(signal);

    showSmallSquares();
    await waitForContinue(signal);

    showBlankUSPage("Out of the 15 largest fires...", "... 7 scorched Oregon.", ["15 largest", "7 scorched Oregon"]);
    await waitForContinue(signal);

    await zoomToState("41", "oregon");
    showZoomPage(
        "Oregon",
        "Oregon: Fire Hotspot",
        "Oregon experienced 7 of the 15 largest fires in 2024, highlighting significant wildfire risk beyond California.",
        4000
    );
    // Disable Continue button until months animation finishes
    continueBtn.style.opacity = 0;
    continueBtn.style.pointerEvents = "none";

    // Animate months first
    await animateOregonMonths(presentationAbortController.signal);

    // Enable Continue button after timeline
    continueBtn.style.opacity = 1;
    continueBtn.style.pointerEvents = "auto";
    await waitForContinue(signal);

    showBlankUSPage("Wildfire risk is everywhere...","... now it's your turn to explore.", ["everywhere", "explore"]);
    await waitForContinue(signal);

    if (monthSlider) {
        monthSlider.value = 10; // October
        monthSlider.dispatchEvent(new Event('input')); // trigger listeners
    }

    // Reset month label
    const monthLabelBottom = document.getElementById("month-label-bottom");
    if (monthLabelBottom) {
        monthLabelBottom.textContent = MONTHS[9]; // October, 0-indexed
    }

    // If you want to show full US map instead:
    if (typeof drawUSView === "function") {
        drawUSView(10);
    }

    showExploratoryPrompt("");
    setTimeout(() => {
        hideExplanation();
        enableMapInteractions();
    }, 500);
}

// =====================
// Wait for user
// =====================
function waitForContinue(signal) {
    return new Promise((resolve, reject) => {
        const box = createExplanationBox();
        let button = box.querySelector('button');
        if (!button) {
            button = document.createElement('button');
            button.textContent = 'Continue →';
            button.style.cssText = `
                margin-top: 24px;
                padding: 12px 28px;
                font-size: 1rem;
                font-weight: 600;
                background: linear-gradient(135deg, #ff6b35, #ff8c5a);
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
            `;
            box.appendChild(button);
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
        signal.addEventListener('abort', abortHandler);
    });
}

// =====================
// Map interaction helpers
// =====================
function disableMapInteractions() {
    document.querySelectorAll('.state, .county').forEach(el => {
        el.style.pointerEvents = 'none';
        el.style.cursor = 'default';
    });
    const slider = document.getElementById('month-range-bottom');
    if (slider) { slider.disabled = true; slider.style.opacity = '0.5'; }
    const back = document.getElementById('back-us');
    if (back) { back.style.pointerEvents = 'none'; back.style.opacity = '0.5'; }
}
function enableMapInteractions() {
    document.querySelectorAll('.state, .county').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
    });
    const slider = document.getElementById('month-range-bottom');
    if (slider) { slider.disabled = false; slider.style.opacity = '1'; }
    const back = document.getElementById('back-us');
    if (back) { back.style.pointerEvents = 'auto'; back.style.opacity = '1'; }
}
