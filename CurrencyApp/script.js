let rate = 1300; // example USD to RWF

function quickConvert() {
    let amount = document.getElementById("amount").value;
    let result = amount * rate;
    document.getElementById("result").innerText = result + " RWF";
}

function convert() {
    let amount = document.getElementById("amount").value;
    let result = amount * rate;

    document.getElementById("output").innerText = result + " RWF";
    document.getElementById("rate").innerText = "Rate: 1 USD = " + rate + " RWF";
    document.getElementById("time").innerText = "Updated: " + new Date();

    saveHistory(amount, result);
}

function swap() {
    let from = document.getElementById("fromCurrency");
    let to = document.getElementById("toCurrency");

    let temp = from.value;
    from.value = to.value;
    to.value = temp;
}

function saveHistory(amount, result) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    let time = new Date().toLocaleString();

    history.push(`${amount} → ${result} ( ${time} )`);

    localStorage.setItem("history", JSON.stringify(history));
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let list = document.getElementById("historyList");

    if (list) {
        history.forEach(item => {
            let li = document.createElement("li");
            li.innerText = item;
            list.appendChild(li);
        });
    }
}

function clearHistory() {
    localStorage.removeItem("history");
    location.reload();
}

function toggleDarkMode(el) {
    document.body.classList.toggle("dark", el.checked);
}

function setDefaultCurrency(currency) {
    localStorage.setItem("defaultCurrency", currency);
}

loadHistory();
// LOAD SAVED SETTINGS
function loadSettings() {
    let dark = localStorage.getItem("darkMode");
    let currency = localStorage.getItem("defaultCurrency");
    let lang = localStorage.getItem("language");

    if (dark === "true") {
        document.body.classList.add("dark");
        document.getElementById("darkToggle").checked = true;
    }

    if (currency) {
        document.getElementById("defaultCurrency").value = currency;
    }

    if (lang) {
        document.getElementById("language").value = lang;
        applyLanguage(lang);
    }
}

// SAVE SETTINGS
function saveSettings() {
    let dark = document.getElementById("darkToggle").checked;
    let currency = document.getElementById("defaultCurrency").value;
    let lang = document.getElementById("language").value;

    localStorage.setItem("darkMode", dark);
    localStorage.setItem("defaultCurrency", currency);
    localStorage.setItem("language", lang);

    applyLanguage(lang);

    alert("Settings saved!");
}

// DARK MODE TOGGLE LIVE
document.addEventListener("DOMContentLoaded", () => {
    let toggle = document.getElementById("darkToggle");

    if (toggle) {
        toggle.addEventListener("change", () => {
            document.body.classList.toggle("dark", toggle.checked);
        });
    }

    loadSettings();
});

// LANGUAGE SYSTEM (simple)
function applyLanguage(lang) {
    if (lang === "fr") {
        document.querySelector("h2").innerText = "Paramètres";
    }
    else if (lang === "rw") {
        document.querySelector("h2").innerText = "Igenamiterere";
    }
    else {
        document.querySelector("h2").innerText = "⚙️ Settings";
    }
}