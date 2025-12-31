console.log("Bill Splitter loaded!");
// This array will store the names of people added
let people = [];

let splitHistory = []; // This array will store all previous splits

// Load the wheel spinning sound (combined with winner cue)
const wheelSound = new Audio("assets/wheel-sound.mp3");
wheelSound.volume = 0.8;

// Function to add a person to the list with a percentage input
function addPerson() {
    const nameInput = document.getElementById("personName");
    const name = nameInput.value.trim();

    // Validate name: Letters and spaces only
    if (name === "" || /[^A-Za-z ]/.test(name)) {
        alert("Please enter a valid name (letters and spaces only).");
        nameInput.focus();
        return;
    }

    // Add person to array
    people.push(name);

    // Create a list item to show name and percentage input
    const listItem = document.createElement("li");
    listItem.className = "list-group-item d-flex justify-content-between align-items-center";

    // Create text span for name
    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;

    // Append name only in Step 2 (percentages are handled in Step 3)
    listItem.appendChild(nameSpan);

    // Add to the list in HTML
    document.getElementById("peopleList").appendChild(listItem);

    // Clear input
    nameInput.value = "";

    // Redraw wheel and re-render Step 3 percent inputs after adding person
    if (people.length > 0) {
        drawWheel();
    }
    renderPercentInputs();
}

// Function to split the bill equally
function splitEqually() {
    const currency = document.getElementById("currency").value;
    // Get the bill amount from the input field
    const billAmount = parseFloat(document.getElementById("billAmount").value);

    // Validate the bill amount
    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid bill amount!");
        return;
    }

    // Make sure at least one person is added
    if (people.length === 0) {
        alert("Please add at least one person!");
        return;
    }

    // Calculate how much each person has to pay
    const share = (billAmount / people.length).toFixed(2); // 2 decimal places

    // Show the result section
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("d-none");

    // Clear any old results
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    // Display how much each person pays
    people.forEach(person => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = `${person} pays ${currency}${share}`;
        resultList.appendChild(item);
    });

    // Save to history once after displaying
    const summary = people.map(person => ({
        name: person,
        amount: `${currency}${share}`
    }));
    saveToHistory("Equal Split", summary);
}

// Function to split the bill by custom percentages
function splitByPercentage() {
    const currency = document.getElementById("currency").value;
    const billAmount = parseFloat(document.getElementById("billAmount").value);

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid bill amount!");
        return;
    }

    if (people.length === 0) {
        alert("Please add at least one person!");
        return;
    }

    // Read all percentage inputs from Step 3
    const percentInputs = document.querySelectorAll('#percentList input.percent-input');

    let totalPercent = 0;
    const splitData = [];

    percentInputs.forEach(input => {
        const name = input.getAttribute('data-name') || 'Unknown';
        const rawValue = (input.value || '').trim();

        if (rawValue === "") {
            alert(`Please enter a percentage for ${name}`);
            input.focus();
            throw new Error("Missing percentage input");
        }

        const percent = parseFloat(rawValue);
        if (isNaN(percent) || percent < 0) {
            alert(`Invalid percentage for ${name}`);
            input.focus();
            throw new Error("Invalid percentage input");
        }

        totalPercent += percent;
        splitData.push({
            name,
            percent
        });
    });

    if (Math.round(totalPercent) !== 100) {
        alert(`Total percentage must be exactly 100%. It's currently ${totalPercent}%.`);
        return;
    }

    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("d-none");

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    splitData.forEach(entry => {
        const amount = ((entry.percent / 100) * billAmount).toFixed(2);
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = `${entry.name} pays ${currency}${amount} (${entry.percent}%)`;
        resultList.appendChild(item);
    });

    // Save once after building
    saveToHistory("Percentage Split", splitData.map(entry => ({
        name: entry.name,
        amount: `${currency}${((entry.percent / 100) * billAmount).toFixed(2)}`
    })));
}

// Function for Luck Mode: One pays nothing, rest split the full bill
function luckModeSplit() {
    const currency = document.getElementById("currency").value;
    const billAmount = parseFloat(document.getElementById("billAmount").value);

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid bill amount!");
        return;
    }

    if (people.length < 2) {
        alert("At least 2 people are needed for Luck Mode!");
        return;
    }

    // Picking a random lucky person
    const luckyIndex = Math.floor(Math.random() * people.length);
    const luckyPerson = people[luckyIndex];

    // Calculate how much each other person pays
    const payingPeople = people.filter((_, index) => index !== luckyIndex);
    const share = (billAmount / payingPeople.length).toFixed(2);

    // Show the result section
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("d-none");

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    // Display the result
    people.forEach((person, index) => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        if (index === luckyIndex) {
            item.textContent = `🎉 ${person} got lucky and pays ${currency}0!`;
        } else {
            item.textContent = `${person} pays ${currency}${share}`;
        }
        resultList.appendChild(item);
    });
}

// Save split to history
function saveToHistory(type, data) {
    const history = JSON.parse(localStorage.getItem("splitHistory")) || [];
    const timestamp = new Date().toLocaleString();

    history.unshift({
        type,
        data,
        timestamp
    }); // add to beginning
    localStorage.setItem("splitHistory", JSON.stringify(history));
    renderHistory(); // update display
}

// Show split history
function renderHistory() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    const history = JSON.parse(localStorage.getItem("splitHistory")) || [];

    if (history.length === 0) {
        historyList.innerHTML = "<li class='list-group-item text-muted'>No history yet.</li>";
        return;
    }

    history.forEach((entry, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item";

        const summary = document.createElement("div");
        summary.innerHTML = `<strong>${entry.type}</strong> - ${entry.timestamp}`;

        const detail = document.createElement("ul");
        detail.className = "mt-2";

        entry.data.forEach(person => {
            const item = document.createElement("li");
            item.textContent = `${person.name} pays ${person.amount}`;
            detail.appendChild(item);
        });

        li.appendChild(summary);
        li.appendChild(detail);
        historyList.appendChild(li);
    });
}

// Clear history
function clearHistory() {
    localStorage.removeItem("splitHistory");
    renderHistory();
}

// Load history on page load
document.addEventListener("DOMContentLoaded", renderHistory);

// ========== SPIN THE WHEEL FEATURE ========== //

// Track the current angle and winner
let wheelAngle = 0;
let spinning = false;

// Function to draw the wheel
function drawWheel() {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas || people.length === 0) return;

    const ctx = canvas.getContext("2d");

    const radius = canvas.width / 2;
    const numSegments = people.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Predefined palette of 10 distinct colors
    const palette = [
        '#FF4500', // Bright Orange-Red
        '#FFD700', // Golden Yellow
        '#32CD32', // Lime Green
        '#1E90FF', // Dodger Blue
        '#FF69B4', // Hot Pink
        '#673AB7', // Deep Purple
        '#40E0D0', // Turquoise
        '#FF3B1F', // Orange-Red (variant)
        '#8B0000', // Dark Red
        '#00FF7F' // Spring Green
    ];

    // Draw each segment
    people.forEach((person, i) => {
        const startAngle = i * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;

        // Choose color from palette
        ctx.fillStyle = palette[i % palette.length];
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Add person name
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff"; // White text for better visibility
        ctx.font = "bold 16px sans-serif"; // Increased font size and made bold

        // Add text shadow/outline for better visibility
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(person, radius - 15, 8); // Adjusted positioning
        ctx.restore();
    });
}

// Function to spin the wheel
function spinWheel() {
    if (people.length === 0) {
        alert("Add people before spinning the wheel!");
        return;
    }

    if (spinning) return;

    spinning = true;

    // Sync audio with 13s spin
    try {
        wheelSound.currentTime = 0;
    } catch (_) {}
    wheelSound.play();

    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");
    const resultText = document.getElementById("wheelResult");
    const breakdownList = document.getElementById("wheelBreakdown");
    const durationMs = 13000; // exact 13 seconds
    const startTime = performance.now();

    const numSegments = people.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;

    // Pointer angle at the very top pointing inward (12 o'clock)
    const pointerAngle = -Math.PI / 2; // equivalent to 3*Math.PI/2

    // Preselect a winner and compute a final angle that lands them at the top
    const winnerIndex = Math.floor(Math.random() * numSegments);
    const winnerMidAngle = winnerIndex * anglePerSegment + anglePerSegment / 2;

    // Choose a pleasing number of extra rotations
    const extraRotations = 8;
    const targetAngle = pointerAngle - winnerMidAngle + extraRotations * 2 * Math.PI;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function render(angle) {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawWheel();
        ctx.restore();
    }

    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / durationMs, 1);
        const eased = easeOutCubic(t);
        wheelAngle = eased * targetAngle;
        render(wheelAngle);

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            const winner = people[winnerIndex];
            resultText.textContent = `🎉 ${winner} has been selected!`;

            // Build and show the discounted payment breakdown
            breakdownList.innerHTML = "";
            // Add a header to make it clear the breakdown is working
            const header = document.createElement("li");
            header.className = "list-group-item list-group-item-primary fw-bold";
            header.textContent = "💰 Payment Breakdown (50% off for winner!)";
            breakdownList.appendChild(header);

            console.log("Building breakdown for winner:", winner);
            console.log("Breakdown element:", breakdownList);

            const currency = document.getElementById("currency").value;
            const billAmount = parseFloat(document.getElementById("billAmount").value);
            console.log("Currency:", currency, "Bill amount:", billAmount);

            if (!isNaN(billAmount) && billAmount > 0 && people.length > 0) {
                // Original equal share
                const originalShare = billAmount / people.length;
                const winnerNewPay = originalShare * 0.5;
                const discount = originalShare - winnerNewPay;
                console.log("Original share:", originalShare, "Winner new pay:", winnerNewPay, "Discount:", discount);

                // Remaining to distribute among others equally
                const othersCount = people.length - 1;
                const redistributed = discount / (othersCount > 0 ? othersCount : 1);
                console.log("Others count:", othersCount, "Redistributed per person:", redistributed);

                people.forEach((p, idx) => {
                    const li = document.createElement("li");
                    li.className = "list-group-item";
                    if (idx === winnerIndex) {
                        li.textContent = `${p}: original ${currency}${originalShare.toFixed(2)} → new ${currency}${winnerNewPay.toFixed(2)} (50% off)`;
                    } else {
                        const newPay = originalShare + redistributed;
                        li.textContent = `${p}: ${currency}${newPay.toFixed(2)}`;
                    }
                    console.log("Adding list item:", li.textContent);
                    breakdownList.appendChild(li);
                });
                console.log("Final breakdown list children:", breakdownList.children.length);
            } else {
                console.log("Invalid bill amount or no people:", billAmount, people.length);
            }

            // Ensure audio stops at the end of the spin
            try {
                wheelSound.pause();
                wheelSound.currentTime = 0;
            } catch (_) {}
        }
    }

    requestAnimationFrame(animate);
}

// ====== DICE ROLL FUNCTION ======

function rollDice() {
    const billAmount = parseFloat(document.getElementById("billAmount").value);
    const currency = document.getElementById("currency").value;
    const resultDiv = document.getElementById("diceResult");

    if (people.length < 2) {
        alert("Add at least two people to use the dice roll!");
        return;
    }

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Enter a valid bill amount first!");
        return;
    }

    // Randomly select a person
    const randomIndex = Math.floor(Math.random() * people.length);
    const selected = people[randomIndex];

    // Show result
    resultDiv.textContent = `🎲 ${selected} has been chosen to pay the full amount: ${currency}${billAmount.toFixed(2)}!`;

    // Save result to history
    saveToHistory("🎲 Dice Roll", [{
        name: selected,
        amount: `${currency}${billAmount.toFixed(2)}`
    }]);
}

// ===== New Dice Roll with animation and number matching =====
function rollDiceAnimated() {
    const resultDiv = document.getElementById("diceResult");

    if (people.length < 2) {
        alert("Add at least two people to use the dice roll!");
        return;
    }

    const cube = document.getElementById("diceCube");
    if (!cube) {
        alert("Dice UI not found.");
        return;
    }

    // Ensure dice picks exist without wiping current selections
    if (document.querySelectorAll('#dicePicks .pick-row').length === 0) {
        renderDicePicks();
    } else {
        syncDicePickOptions();
    }
    // Validate selections depending on mode
    const modeInput = document.querySelector('input[name="diceMode"]:checked');
    const mode = (modeInput && modeInput.value) ? modeInput.value : 'coverAll';
    if (mode === 'coverAll') {
        ensureOptionACoverage();
        if (!validateDiceSelections('chosenOnly')) return; // after coverage, still ensure each has one
    } else {
        // Option B: ensure at least one selection per person
        if (!validateDiceSelections('chosenOnly')) return;
    }

    // Gather selections; allow multiple picks per person
    const personToNumbers = new Map(); // name -> number[]
    const numberToPeople = new Map(); // number -> name[]
    const rows = document.querySelectorAll('#dicePicks .pick-row');
    rows.forEach(row => {
        const name = row.querySelector('.pick-name')?.textContent?.trim();
        const select = row.querySelector('select[data-pick-multi]');
        if (!name || !select) return;
        const chosen = [];
        Array.from(select.selectedOptions).forEach(opt => {
            const v = parseInt(opt.value, 10);
            if (v >= 1 && v <= 6) chosen.push(v);
        });
        personToNumbers.set(name, chosen);
        chosen.forEach(n => {
            const arr = numberToPeople.get(n) || [];
            arr.push(name);
            numberToPeople.set(n, arr);
        });
    });

    // Build rollable numbers set based on mode
    let rollableNumbers = [];
    if (mode === 'chosenOnly') {
        for (let n = 1; n <= 6; n++)
            if ((numberToPeople.get(n) || []).length > 0) rollableNumbers.push(n);
        if (rollableNumbers.length === 0) {
            alert('No numbers chosen. Pick numbers first.');
            return;
        }
    } else {
        // coverAll: Ensure all numbers 1-6 are covered; if gaps, auto-assign to players in round-robin
        const missing = [];
        for (let n = 1; n <= 6; n++)
            if ((numberToPeople.get(n) || []).length === 0) missing.push(n);
        if (missing.length > 0) {
            const names = people.slice();
            if (names.length === 0) {
                alert('Add people first.');
                return;
            }
            let idx = 0;
            missing.forEach(n => {
                const name = names[idx % names.length];
                const nums = personToNumbers.get(name) || [];
                if (!nums.includes(n)) nums.push(n);
                personToNumbers.set(name, nums);
                const arr = numberToPeople.get(n) || [];
                if (!arr.includes(name)) arr.push(name);
                numberToPeople.set(n, arr);
                idx++;
            });
            // Update UI selections to reflect auto-assigned numbers
            const rows2 = document.querySelectorAll('#dicePicks .pick-row');
            rows2.forEach(row => {
                const name = row.querySelector('.pick-name')?.textContent?.trim();
                const select = row.querySelector('select[data-pick-multi]');
                if (!name || !select) return;
                const set = new Set(personToNumbers.get(name) || []);
                Array.from(select.options).forEach(opt => {
                    opt.selected = set.has(parseInt(opt.value, 10));
                });
            });
        }
        rollableNumbers = [1, 2, 3, 4, 5, 6];
    }

    // Start rolling animation
    cube.classList.remove('rolling');
    void cube.offsetWidth; // reflow to restart animation
    cube.classList.add('rolling');

    // Decide die result from allowed numbers and orient cube to show that number on top at the end
    const resultNumber = rollableNumbers[Math.floor(Math.random() * rollableNumbers.length)];

    // After animation, snap to the orientation that shows the number on top
    setTimeout(() => {
        cube.classList.remove('rolling');
        const rotations = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateY(-90deg)',
            3: 'rotateY(180deg)',
            4: 'rotateY(90deg)',
            5: 'rotateX(-90deg)',
            6: 'rotateX(90deg)'
        };
        cube.style.transform = rotations[resultNumber] || 'rotateX(0deg) rotateY(0deg)';

        // Find candidates who picked the rolled number
        const candidates = (numberToPeople.get(resultNumber) || []).slice();

        if (candidates.length === 0) {
            resultDiv.textContent = `No one picked ${resultNumber}. Try again!`;
            return;
        }

        // If multiple, pick one randomly
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        resultDiv.textContent = `🎲 Rolled ${resultNumber}. Person Selected: ${winner}!`;
    }, 2200); // ~2.2s roll duration to match CSS
}

// Redraw wheel when people list changes
function renderDicePicks() {
    const wrap = document.getElementById('dicePicks');
    if (!wrap) return;
    wrap.innerHTML = '';
    people.forEach(name => {
        const row = document.createElement('div');
        row.className = 'pick-row';
        const label = document.createElement('div');
        label.className = 'pick-name';
        label.textContent = name;
        const select = document.createElement('select');
        select.setAttribute('multiple', 'multiple');
        select.className = 'form-select form-select-sm number-picks';
        select.setAttribute('size', '3');
        select.setAttribute('data-pick-multi', 'true');
        for (let n = 1; n <= 6; n++) {
            const opt = document.createElement('option');
            opt.value = String(n);
            opt.textContent = String(n);
            select.appendChild(opt);
        }
        row.appendChild(label);
        row.appendChild(select);
        wrap.appendChild(row);
    });

    // Attach change handlers to enforce unique numbers and reflect mode
    const selects = wrap.querySelectorAll('select[data-pick-multi]');
    selects.forEach(sel => sel.addEventListener('change', () => {
        syncDicePickOptions();
    }));

    // Initial sync
    syncDicePickOptions();
}

// Read current dice assignments from UI
function readDiceAssignments() {
    const rows = document.querySelectorAll('#dicePicks .pick-row');
    const personToNumbers = new Map();
    const numberToPerson = new Map();
    const chosenSet = new Set();
    rows.forEach(row => {
        const name = row.querySelector('.pick-name')?.textContent?.trim();
        const select = row.querySelector('select[data-pick-multi]');
        if (!name || !select) return;
        const nums = [];
        Array.from(select.selectedOptions).forEach(opt => {
            const v = parseInt(opt.value, 10);
            if (v >= 1 && v <= 6) {
                nums.push(v);
                chosenSet.add(v);
                if (!numberToPerson.has(v)) numberToPerson.set(v, name);
            }
        });
        personToNumbers.set(name, nums);
    });
    return {
        personToNumbers,
        numberToPerson,
        chosenSet
    };
}

// Disable options that are already chosen by other users to keep numbers unique
function syncDicePickOptions() {
    const wrap = document.getElementById('dicePicks');
    if (!wrap) return;
    const {
        numberToPerson
    } = readDiceAssignments();
    const rows = wrap.querySelectorAll('.pick-row');
    rows.forEach(row => {
        const name = row.querySelector('.pick-name')?.textContent?.trim();
        const select = row.querySelector('select[data-pick-multi]');
        if (!name || !select) return;
        Array.from(select.options).forEach(opt => {
            const v = parseInt(opt.value, 10);
            const takenBy = numberToPerson.get(v);
            // Disable if taken by someone else
            const shouldDisable = !!takenBy && takenBy !== name;
            opt.disabled = shouldDisable;
            // If this option became disabled and was selected here due to conflict, unselect it
            if (shouldDisable && opt.selected) {
                opt.selected = false;
            }
        });
    });
}

// For Option A: ensure all 1-6 are covered; if not, auto-assign remaining numbers to players with the fewest picks
function ensureOptionACoverage() {
    const wrap = document.getElementById('dicePicks');
    if (!wrap) return;
    const {
        personToNumbers,
        chosenSet
    } = readDiceAssignments();
    const remaining = [];
    for (let n = 1; n <= 6; n++)
        if (!chosenSet.has(n)) remaining.push(n);
    if (remaining.length === 0) return;

    // Build list of [name, currentCount]
    const rows = Array.from(wrap.querySelectorAll('.pick-row'));
    const peopleCounts = rows.map(row => {
        const name = row.querySelector('.pick-name')?.textContent?.trim();
        const current = (personToNumbers.get(name) || []).length;
        return {
            name,
            row,
            current
        };
    }).filter(x => !!x.name);

    // Assign remaining numbers one by one to the person with the fewest numbers
    remaining.forEach(num => {
        peopleCounts.sort((a, b) => a.current - b.current);
        const target = peopleCounts[0];
        const select = target.row.querySelector('select[data-pick-multi]');
        if (select) {
            const opt = Array.from(select.options).find(o => parseInt(o.value, 10) === num && !o.disabled);
            if (opt) {
                opt.selected = true;
                target.current += 1;
            }
        }
    });

    // After assignment, resync disabled state
    syncDicePickOptions();
}

// Validate selections according to mode; returns boolean
function validateDiceSelections(mode) {
    const wrap = document.getElementById('dicePicks');
    if (!wrap) return false;
    const rows = wrap.querySelectorAll('.pick-row');

    // No players
    if (rows.length === 0) return false;

    // Build ownership map and ensure each person has at least one where required
    const numbersOwned = new Set();
    let allHaveAtLeastOne = true;
    rows.forEach(row => {
        const select = row.querySelector('select[data-pick-multi]');
        if (select && select.selectedOptions.length === 0) {
            allHaveAtLeastOne = false;
        }
        Array.from(select.selectedOptions).forEach(opt => numbersOwned.add(parseInt(opt.value, 10)));
    });

    if (mode === 'chosenOnly') {
        if (!allHaveAtLeastOne) {
            alert('Please ensure every person selects at least one number.');
            return false;
        }
    }

    // Check for duplicates indirectly: our disabling should prevent it, but verify
    const seen = new Set();
    for (const n of numbersOwned) {
        if (seen.has(n)) {
            alert('Each number must be unique.');
            return false;
        }
        seen.add(n);
    }
    return true;
}

const observer = new MutationObserver(() => {
    renderDicePicks();
    drawWheel();
});
observer.observe(document.getElementById("peopleList"), {
    childList: true
});

// Render percentage inputs in Step 3
function renderPercentInputs() {
    const list = document.getElementById('percentList');
    if (!list) return;
    list.innerHTML = '';
    people.forEach(name => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        const label = document.createElement('span');
        label.className = 'percent-name';
        label.textContent = name;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '100';
        input.placeholder = '%';
        input.className = 'form-control ms-3 percent-input';
        input.style.width = '80px';
        input.setAttribute('data-name', name);
        li.appendChild(label);
        li.appendChild(input);
        list.appendChild(li);
    });
}

// Function to randomly split the bill in percentages
function splitRandomly() {
    const currency = document.getElementById("currency").value;
    const billAmount = parseFloat(document.getElementById("billAmount").value);

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid bill amount!");
        return;
    }

    if (people.length === 0) {
        alert("Please add at least one person!");
        return;
    }

    const numPeople = people.length;
    let percentages = [];

    // Generate random numbers and normalize them to total 100%
    let randoms = [];
    let total = 0;

    for (let i = 0; i < numPeople; i++) {
        const r = Math.random();
        randoms.push(r);
        total += r;
    }

    // Convert randoms to percentages
    let remaining = 100;
    for (let i = 0; i < numPeople; i++) {
        let percent = Math.floor((randoms[i] / total) * 100);
        // For last person, assign remaining to avoid rounding errors
        if (i === numPeople - 1) percent = remaining;
        remaining -= percent;
        percentages.push(percent);
    }

    // Show results
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("d-none");

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    people.forEach((person, index) => {
        const percent = percentages[index];
        const amount = ((percent / 100) * billAmount).toFixed(2);
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = `${person} pays ${currency}${amount} (${percent}%)`;
        resultList.appendChild(item);
    });
}

// Function for Luck Mode: One person pays nothing, others split the full bill
function luckMode() {
    const currency = document.getElementById("currency").value;
    const billAmount = parseFloat(document.getElementById("billAmount").value);

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid bill amount!");
        return;
    }

    if (people.length < 2) {
        alert("Add at least two people for Luck Mode!");
        return;
    }

    // Pick a lucky person
    const luckyIndex = Math.floor(Math.random() * people.length);
    const luckyPerson = people[luckyIndex];

    // Filter out the lucky person for splitting
    const payers = people.filter((_, i) => i !== luckyIndex);

    const share = (billAmount / payers.length).toFixed(2);

    // Show result section
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("d-none");

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    // Show each person's payment
    people.forEach((person, index) => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        if (index === luckyIndex) {
            item.textContent = `${person} is lucky and pays ${currency}0.00 🎉`;
        } else {
            item.textContent = `${person} pays ${currency}${share}`;
        }
        resultList.appendChild(item);
    });
}

// ====== LUCK MODE FUNCTION ======

function activateLuckMode() {
    const currency = document.getElementById("currency").value;
    const billAmount = parseFloat(document.getElementById("billAmount").value);
    const resultDiv = document.getElementById("luckResult");

    if (people.length < 2) {
        alert("Add at least two people to use Luck Mode!");
        return;
    }

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Enter a valid bill amount first!");
        return;
    }

    // Randomly choose a lucky person
    const luckyIndex = Math.floor(Math.random() * people.length);
    const luckyPerson = people[luckyIndex];

    // Others split the bill
    const others = people.filter((_, index) => index !== luckyIndex);
    const share = (billAmount / others.length).toFixed(2);

    // Display result
    resultDiv.innerHTML = `🍀 <strong>${luckyPerson}</strong> is lucky and pays nothing!<br>` +
        `Everyone else pays: ${currency}${share}`;

    // Save result to history
    const splitDetails = others.map(name => ({
        name: name,
        amount: `${currency}${share}`
    }));

    splitDetails.push({
        name: luckyPerson,
        amount: `${currency}0.00 (Lucky!)`
    });

    saveToHistory("🍀 Luck Mode", splitDetails);
}

// Function for Dice Roll Game: One person pays the entire bill
function diceRoll() {
    const currency = document.getElementById("currency").value;
    const billAmount = parseFloat(document.getElementById("billAmount").value);

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid bill amount!");
        return;
    }

    if (people.length < 2) {
        alert("Add at least two people for Dice Roll!");
        return;
    }

    // Pick one unlucky person
    const payerIndex = Math.floor(Math.random() * people.length);
    const unluckyPerson = people[payerIndex];

    // Show the result section
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("d-none");

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    // Display results
    people.forEach((person, index) => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        if (index === payerIndex) {
            item.textContent = `${person} pays the full bill of ${currency}${billAmount.toFixed(2)} 😬`;
        } else {
            item.textContent = `${person} pays ${currency}0.00 🙌`;
        }
        resultList.appendChild(item);
    });
}

// Load dark mode preference on page load
window.addEventListener("DOMContentLoaded", () => {
    const darkModeSetting = localStorage.getItem("darkMode") === "true";
    const darkModeToggleEl = document.getElementById("darkModeToggle");
    if (darkModeToggleEl && "checked" in darkModeToggleEl) {
        try {
            darkModeToggleEl.checked = darkModeSetting;
        } catch (_) {}
    }
    document.body.classList.toggle("dark-mode", darkModeSetting);
});
// Function to copy result list to clipboard
function copyResult() {
    const resultItems = document.querySelectorAll("#resultList li");

    if (resultItems.length === 0) {
        alert("No result to copy!");
        return;
    }

    let resultText = "Bill Split Result:\n";
    resultItems.forEach(item => {
        resultText += "- " + item.textContent + "\n";
    });

    // Use Clipboard API
    navigator.clipboard.writeText(resultText)
        .then(() => {
            const msg = document.getElementById("copyMsg");
            msg.classList.remove("d-none");

            // Hide after 2 seconds
            setTimeout(() => msg.classList.add("d-none"), 2000);
        })
        .catch(err => {
            alert("Failed to copy: " + err);
        });
}

// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    // Save the preference
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDark);

    // Update the button text
    const darkToggle = document.getElementById("darkToggle");
    if (darkToggle) {
        darkToggle.textContent = isDark ? "☀️ Light Mode" : "�� Dark Mode";
    }

    // Update the shortcut text
    const shortcutInfo = document.getElementById("shortcutInfo");
    if (shortcutInfo) {
        shortcutInfo.textContent = isDark ? "(Ctrl + L)" : "(Ctrl + D)";
    }
}

// Enable keyboard shortcuts for dark/light mode
document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "d") {
        event.preventDefault();
        if (!document.body.classList.contains("dark-mode")) {
            toggleDarkMode();
        }
    }
    if (event.ctrlKey && event.key === "l") {
        event.preventDefault();
        if (document.body.classList.contains("dark-mode")) {
            toggleDarkMode();
        }
    }
});

// On page load, apply saved theme
// Removed extra window.onload to avoid overriding other handlers
// Function to save and display split history
// Removed duplicate saveToHistory that conflicted with localStorage version
// Function to reset the app to its initial state
function clearAll() {
    // Clear input fields
    document.getElementById("billAmount").value = "";
    document.getElementById("personName").value = "";
    document.getElementById("currency").value = "$";

    // Clear arrays and lists
    people = [];
    document.getElementById("peopleList").innerHTML = "";
    document.getElementById("resultList").innerHTML = "";
    document.getElementById("result").classList.add("d-none");

    // Clear wheel canvas
    const canvas = document.getElementById("wheelCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Optionally clear history
    document.getElementById("historyList").innerHTML = "";
    localStorage.removeItem("billHistory");

    console.log("App reset.");
}
// Function to download history as a .txt file
function downloadHistory() {
    const historyItems = document.querySelectorAll("#historyList li");
    if (historyItems.length === 0) {
        alert("No history to download!");
        return;
    }

    let text = "💸 Bill Splitter History\n\n";
    historyItems.forEach((item, index) => {
        text += `${index + 1}. ${item.textContent}\n`;
    });

    const blob = new Blob([text], {
        type: "text/plain"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bill_split_history.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Apply saved preference on load
// Removed duplicate window.onload to prevent overriding
// Add event listener for Enter key on person name input
document.addEventListener("DOMContentLoaded", function() {
    const personNameInput = document.getElementById("personName");
    if (personNameInput) {
        personNameInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                addPerson();
            }
        });
    }

    // Load dark mode preference
    const darkModeSetting = localStorage.getItem("darkMode") === "true";
    if (darkModeSetting) {
        document.body.classList.add("dark-mode");
        const darkToggle = document.getElementById("darkToggle");
        if (darkToggle) {
            darkToggle.textContent = "☀️ Light Mode";
        }
        const shortcutInfo = document.getElementById("shortcutInfo");
        if (shortcutInfo) {
            shortcutInfo.textContent = "(Ctrl + L)";
        }
    }

    // Render history
    renderHistory();
    // Render initial percent inputs if any people exist
    renderPercentInputs();
});

// Strict input constraints - Input Validation
(function() {
    const billInput = document.getElementById("billAmount");
    if (billInput) {
        billInput.addEventListener('keydown', function(e) {
            // Block e/E, +, -
            if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                e.preventDefault();
            }
        });
        billInput.addEventListener('input', function() {
            // Remove accidental non-numeric characters except dot
            this.value = this.value.replace(/[^0-9.]/g, '');
        });
    }

    const nameInput = document.getElementById("personName");
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            // Allow only letters and spaces
            this.value = this.value.replace(/[^A-Za-z ]/g, '');
        });
    }
})();
