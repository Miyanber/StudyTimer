const div_circle_study = document.querySelector("div.circle"),
    div_circle_break = document.querySelector("div.circle_break"),
    minutes = document.querySelector("span.minutes"),
    seconds = document.querySelector("span.seconds"),
    notification_to_break = document.getElementById("notification_to_break"),
    notification_to_study = document.getElementById("notification_to_study"),
    start_break_button = document.getElementById("start_break"),
    start_study_button = document.getElementById("start_study");
let start_study_audio = null,
    start_break_audio = null;


const timer_division = document.getElementById("timer");
const timer_status = document.getElementById("timer_status");
const delete_button = document.getElementById("delete");
const save_button = document.getElementById("save");
const study_time = document.getElementById("study_time");
study_time.value = localStorage.getItem("study_time");
const break_time = document.getElementById("break_time");
break_time.value = localStorage.getItem("break_time");
setTimerDisplay(study_time.value * 60);

let worker;

class Timer {
    /**
     * 内部処理は全て秒
     * @param {Number} timer_min タイマー時間(分)
     */
    constructor(timer_min) {
        if (timer_min == 0 || timer_min == null) {
            this.timer_min = 1 / 60;
        } else {
            this.timer_min = timer_min;
        }
    }

    setTimer(timerType) {
        worker = new Worker("worker.js");

        worker.onmessage = function (e) {
            switch (e.data.name) {
                case "to_break":
                    notification_to_break.classList.remove("hidden");
                    start_break_audio.play();
                    break;
                case "circle_study":
                    div_circle_study.style.background =
                        `conic-gradient(#799aff 0deg ${e.data.degree}deg, #333 ${e.data.degree}deg 360deg)`;
                    break;
                case "setTimerDisplay":
                    setTimerDisplay(e.data.param);
                    break;
                case "to_study":
                    notification_to_study.classList.remove("hidden");
                    start_study_audio.play();
                    break;
                case "circle_break":
                    div_circle_break.style.background =
                        `conic-gradient(#ff6060 0deg ${e.data.degree}deg, #505050 ${e.data.degree}deg 360deg)`;
                    break;
                default:
                    break;
            }
        }
        switch (timerType) {
            case "study":
                worker.postMessage({ name: "setTimer_study", timer_sec: this.timer_min });
                break;
            case "break":
                worker.postMessage({ name: "setTimer_break", timer_sec: this.timer_min });
                break;
        }
    }

    startTimer() {
        timer.resumeTimer();
        study_time.disabled = true;
        break_time.disabled = true;
    }

    startStudyTimer() {
        timer = new Timer(study_time.value);
        timer.setTimer("study");
        timer.startTimer();
    }

    startBreakTimer() {
        timer = new Timer(break_time.value);
        timer.setTimer("break");
        timer.startTimer();
    }

    resumeTimer() {
        worker.postMessage({ name: "startTimer" });
        timer_status.classList.remove("restart");
        timer_status.classList.add("pause");
        timer_status.textContent = "一時停止";
        delete_button.disabled = true;
    }

    pauseTimer() {
        worker.postMessage({ name: "pauseTimer" });
        timer_status.classList.add("restart");
        timer_status.classList.remove("pause");
        timer_status.textContent = "再開";
        delete_button.disabled = false;
    }

    resetTimer() {
        if (worker) {
            worker.terminate();
            timer_status.classList.remove("restart");
            timer_status.textContent = "タップして開始";
            study_time.disabled = false;
            break_time.disabled = false;
            div_circle_study.style.background =
                `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
            div_circle_break.style.background =
                `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
        }
    }
}

let timer = new Timer(0);

function setTimerDisplay(timer_sec) {
    let timer_min = Math.floor(timer_sec / 60);
    let digits = 2;
    if (timer_sec >= 100 * 60) digits = 3;
    minutes.textContent = ("00" + timer_min).slice(-digits);
    seconds.textContent = `${("00" + (timer_sec % 60)).slice(-2)}`;
}

study_time.addEventListener("input", () => {
    setTimerDisplay(study_time.value * 60);
});

timer_division.addEventListener("click", () => {
    if (timer_status.classList.contains("restart")) {
        timer.resumeTimer();
    } else if (timer_status.classList.contains("pause")) {
        timer.pauseTimer();
    } else {
        timer.startStudyTimer();
    }
})

timer_division.addEventListener("click", () => {
    if (start_break_audio) {
        start_break_audio.load();
    }
    if (start_study_audio) {
        start_study_audio.load();
    }
}, { once: true })

delete_button.addEventListener("click", () => {
    timer.resetTimer();
    setTimerDisplay(study_time.value * 60);
});

save_button.addEventListener("click", () => {
    // 設定を保存
    localStorage.setItem("study_time", study_time.value);
    localStorage.setItem("break_time", break_time.value);
    alert("勉強・休憩時間の設定がブラウザに保存されました。")
});

start_break_button.addEventListener("click", () => {
    start_break_audio.pause();
    start_break_audio.currentTime = 0;
    notification_to_break.classList.add("hidden");
    timer.startBreakTimer();
})

start_study_button.addEventListener("click", () => {
    start_study_audio.pause();
    start_study_audio.currentTime = 0;
    notification_to_study.classList.add("hidden");
    div_circle_study.style.background =
        `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
    div_circle_break.style.background =
        `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
    timer.startStudyTimer();
})

//### ここから 画面起動ロック API ###

if ("wakeLock" in navigator) {
    isSupported = true;
    console.log("起動ロック API に対応しています。");
} else {
    wakeButton.disabled = true;
    console.log("このブラウザーは起動ロックに対応していません。");
}

// 起動ロックの参照を作成
let wakeLock = null;

// 非同期関数を作成して起動ロックをリクエスト
(async () => {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("起動ロックが有効です。");
        alert("このWebサイトでは、タイマーを継続して起動させるため、画面スリーブを停止しています。")
    } catch (err) {
        // 起動ロックのリクエストに失敗。ふつうはバッテリーなどのシステム関連
        console.warn(`${err.name}, ${err.message}`);
        alert("画面スリープが停止できません。このWebサイトでは、タイマーを継続して起動させるため、画面スリーブを停止する必要があります。バッテリイーセーバー等の設定を確認して下さい。")
    }
})()

document.addEventListener("visibilitychange", async () => {
    if (wakeLock !== null && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
    }
});

//### ここまで 画面起動ロック API ###

//### ここから アラーム音選択画面 ###

// IndexedDB
let db;
const request = indexedDB.open("audioDB", 3);

request.onerror = (event) => {
    console.error('Error opening IndexedDB:', event.target.errorCode);
};

function getAudio(id) {
    return new Promise((resolve, reject) => {
        let audioElement;
        const transaction = db.transaction("music", "readonly");
        const objectStore = transaction.objectStore("music");
        const request = objectStore.get(id);

        request.onsuccess = () => {
            console.log(request)
            audioElement = new Audio(request.result.url);
            audioElement.load();
            const fileName = document.getElementById(id + "_currentAudio");
            fileName.textContent = request.result.name;
            // TODO: ファイル名を表示する
            console.log("アラーム音を復元しました。");
            resolve(audioElement);
        };

        request.onerror = () => {
            console.log("アラーム音の復元に失敗しました。");
            reject();
        };
    })
}

request.onsuccess = async (event) => {
    db = event.target.result;

    start_study_audio = await getAudio("studyMusic");
    start_break_audio = await getAudio("breakMusic");
};

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const objectStore = db.createObjectStore("music", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("id", "id", { unique: true });
    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("url", "url", { unique: false });
};

const musicSelector = document.getElementById("musicSelector");
const openMusicSelectorButton = document.getElementById("openMusicSelector");
const closeMusicSelectorButton = document.getElementById("closeMusicSelector");
const selectMusicButton = document.getElementById("selectMusic");

openMusicSelectorButton.addEventListener("click", () => {
    musicSelector.classList.remove("hidden");
});

selectMusicButton.addEventListener("click", async () => {
    if (start_study_audio) {
        start_study_audio.pause();
    }
    start_study_audio = await saveAudio("studyMusic");

    if (start_break_audio) {
        start_break_audio.pause();
    }
    start_break_audio = await saveAudio("breakMusic");
    
    musicSelector.classList.add("hidden");
});

function saveAudio(id) {
    return new Promise((resolve, reject) => {
        let audioElement;
        const fileInput = document.getElementById(id);
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const url = reader.result;
                const transaction = db.transaction("music", "readwrite");
                const objectStore = transaction.objectStore("music");
                const request = objectStore.get(id);
                request.onerror = (event) => { };

                request.onsuccess = (event) => {
                    const previouseData = event.target.result;
                    if (previouseData) {
                        const request = objectStore.put({ id: id, name: file.name, url: url });
                        request.onsuccess = () => {
                            audioElement = new Audio(url);
                            audioElement.load();
                            console.log("アラーム音を更新しました。");
                            resolve(audioElement);
                        };

                        request.onerror = () => {
                            console.log("アラーム音の更新に失敗しました。");
                            reject();
                        };
                    } else {
                        const request = objectStore.add({ id: id, name: file.name, url: url });

                        request.onsuccess = () => {
                            audioElement = new Audio(url);
                            audioElement.load();
                            console.log("アラーム音を登録しました。");
                            resolve(audioElement);
                        };

                        request.onerror = () => {
                            console.log("アラーム音の登録に失敗しました。");
                            reject();
                        };
                    }
                };
            };
        }
    })
}

closeMusicSelectorButton.addEventListener("click", () => {
    musicSelector.classList.add("hidden");
});

//### ここまで アラーム音選択画面 ###