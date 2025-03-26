const studyCircle = document.querySelector("div.circle"),
    breakCircle = document.querySelector("div.circle_break"),
    minutes = document.querySelector("span.minutes"),
    seconds = document.querySelector("span.seconds"),
    toBreakNotification = document.getElementById("notification_to_break"),
    toStudyNotification = document.getElementById("notification_to_study"),
    startBreakButton = document.getElementById("start_break"),
    startStudyButton = document.getElementById("start_study");

/** @type {HTMLAudioElement | null} */
let studyStartAudio = null
/** @type {HTMLAudioElement | null} */
let breakStartAudio = null;


const timerElement = document.getElementById("timer");
const timerStatus = document.getElementById("timer_status");
const deleteButton = document.getElementById("delete");
const saveButton = document.getElementById("save");
const studyDuration = document.getElementById("study_time");
studyDuration.value = localStorage.getItem("study_time");
const breakDuration = document.getElementById("break_time");
breakDuration.value = localStorage.getItem("break_time");
updateTimeLeft(studyDuration.value * 60);


window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    return
})

class Timer {
    /**
     * @param {string} timerType タイマーの種類 `"study"` | `"break"`
     * @param {Number} duration タイマー時間 (分)
     */
    constructor(timerType, duration) {
        this.timerType = timerType;
        if (duration == 0 || duration == null) {
            this.duration = 1 / 60;
        } else {
            this.duration = duration;
        }

        /** @type {Worker | null} */
        this.worker = new Worker("worker.js");
        this.worker.onmessage = async function (e) {
            switch (e.data.name) {
                case "timerExpired":
                    if (timerType === "study") {
                        await breakStartAudio.play();
                        toBreakNotification.classList.add("active");
                        toBreakNotification.classList.remove("hidden");
                    } else {
                        await studyStartAudio.play();
                        toStudyNotification.classList.add("active");
                        toStudyNotification.classList.remove("hidden");
                    }
                    this.timerStatus = "expired";
                    break;
                case "updateProgress":
                    if (timerType === "study") {
                        studyCircle.style.background =
                            `conic-gradient(#799aff 0deg ${e.data.degree}deg, #333333 ${e.data.degree}deg 360deg)`;
                    } else {
                        breakCircle.style.background =
                            `conic-gradient(#ff6060 0deg ${e.data.degree}deg, #505050 ${e.data.degree}deg 360deg)`;
                    }
                    break;
                case "updateTimeLeft":
                    updateTimeLeft(e.data.param);
                    break;
                default:
                    break;
            }
        }
        this.worker.postMessage({ name: "startTimer", duration: this.duration });

        requestWakeLock();
        timerStatus.classList.remove("restart");
        timerStatus.classList.add("pause");
        timerStatus.textContent = "一時停止";
        deleteButton.disabled = true;
        studyDuration.disabled = true;
        breakDuration.disabled = true;
        this.timerStatus = "running";
    }

    resumeTimer() {
        this.worker.postMessage({ name: "resumeTimer" });
        requestWakeLock();
        timerStatus.classList.remove("restart");
        timerStatus.classList.add("pause");
        timerStatus.textContent = "一時停止";
        deleteButton.disabled = true;
        this.timerStatus = "running";
    }

    pauseTimer() {
        releaseWakeLock();
        this.worker.postMessage({ name: "pauseTimer" });
        timerStatus.classList.add("restart");
        timerStatus.classList.remove("pause");
        timerStatus.textContent = "再開";
        deleteButton.disabled = false;
        this.timerStatus = "pausing";
    }

    resetTimer() {
        if (this.worker) {
            this.worker.terminate();
            timerStatus.classList.remove("restart");
            timerStatus.textContent = "タップして開始";
            studyDuration.disabled = false;
            breakDuration.disabled = false;
            studyCircle.style.background =
                `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
            breakCircle.style.background =
                `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
        }
        this.timerStatus = "expired";
    }

    restoreTimer() {
        localStorage.getItem("timerDuration");
        localStorage.getItem("startDateTime");
    }

    getTimerStatus() {
        return this.timerStatus;
    }
}

/** @type {Timer | null} */
let timer = null;

function updateTimeLeft(timerSeconds) {
    let timerMinutes = Math.floor(timerSeconds / 60);
    let digits = 2;
    if (timerSeconds >= 100 * 60) digits = 3;
    minutes.textContent = ("00" + timerMinutes).slice(-digits);
    seconds.textContent = `${("00" + (timerSeconds % 60)).slice(-2)}`;
}

startBreakButton.addEventListener("click", () => {
    breakStartAudio.pause();
    breakStartAudio.currentTime = 0;
    toBreakNotification.classList.add("hidden");
    toBreakNotification.classList.remove("active");
    timer = new Timer("break", breakDuration.value);
});

startStudyButton.addEventListener("click", () => {
    studyStartAudio.pause();
    studyStartAudio.currentTime = 0;
    toStudyNotification.classList.add("hidden");
    toStudyNotification.classList.remove("active");
    studyCircle.style.background =
        `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
    breakCircle.style.background =
        `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
    timer = new Timer("study", studyDuration.value);
});

studyDuration.addEventListener("input", () => {
    updateTimeLeft(studyDuration.value * 60);
});

timerElement.addEventListener("click", () => {
    if (timer) {
        if (timer.getTimerStatus() === "running") {
            timer.pauseTimer();
            return
        } else if (timer.getTimerStatus() === "pausing") {
            timer.resumeTimer();
            return
        }
    }
    timer = new Timer("study", studyDuration.value);
});

deleteButton.addEventListener("click", () => {
    timer.resetTimer();
    updateTimeLeft(studyDuration.value * 60);
});

saveButton.addEventListener("click", () => {
    // 設定を保存
    localStorage.setItem("study_time", studyDuration.value);
    localStorage.setItem("break_time", breakDuration.value);
    alert("勉強・休憩時間の設定がブラウザに保存されました。")
});

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
// 起動ロックが有効かどうかを示すフラグ
let isActiveScreen = false;

// wakeLock 対応確認
if ("wakeLock" in navigator) {
    // isSupported = true;
    console.log("起動ロック API に対応しています。");
    alert("Study Timer では、タイマーを継続して起動させるため、画面スリーブを停止しています。");
} else {
    // wakeButton.disabled = true;
    alert("このブラウザーは起動ロックに対応していません。Study Timer では、タイマーを継続して起動させるため、画面スリーブを停止する必要があります。");
}

// 非同期関数を作成して起動ロックをリクエスト
async function requestWakeLock() {
    isActiveScreen = true;
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("起動ロックが有効です。");

    } catch (err) {
        // 起動ロックのリクエストに失敗。ふつうはバッテリーなどのシステム関連
        console.warn(`${err.name}, ${err.message}`);
        alert(
            `画面スリープが停止できません。
            Study Timer では、タイマーを継続して起動させるため、画面スリーブを停止する必要があります。
            バッテリーセーバー等の設定を確認して下さい。
            エラー内容: ${err.name}, ${err.message}`
        )
    }
}

async function releaseWakeLock() {
    isActiveScreen = true;
    if (wakeLock !== null) {
        await wakeLock.release().then(() => {
            wakeLock = null;
            console.log("起動ロックを解除しました。");
        });
    }
}

document.addEventListener("visibilitychange", async () => {
    if (wakeLock !== null && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
    }
});

//### ここまで 画面起動ロック API ###

//### ここから アラーム音選択画面 ###

// IndexedDB
let db;
const request = indexedDB.open("audioDB");

request.onerror = (event) => {
    console.error('Error opening IndexedDB:', event.target.errorCode);
};

/** @return {Promise<HTMLAudioElement | null>} */
function getAudio(id) {
    return new Promise((resolve, reject) => {
        let audioElement;
        const transaction = db.transaction("music", "readonly");
        const objectStore = transaction.objectStore("music");
        const request = objectStore.get(id);

        request.onsuccess = () => {
            console.log(request);
            if (request.result) {
                audioElement = new Audio(request.result.url);
                audioElement.load();
                const fileName = document.getElementById(id + "_currentAudio");
                fileName.textContent = request.result.name;
                console.log("アラーム音を復元しました。");
                resolve(audioElement);
            } else {
                console.log("アラーム音が登録されていません。");
                resolve(null);
            }
        };

        request.onerror = () => {
            console.log("アラーム音の復元に失敗しました。");
            reject();
        };
    })
}

request.onsuccess = async (event) => {
    db = event.target.result;

    studyStartAudio = await getAudio("studyMusic");
    if (!studyStartAudio) {
        document.getElementById("studyMusic_currentAudio").textContent = "未設定";
    }
    breakStartAudio = await getAudio("breakMusic");
    if (!breakStartAudio) {
        document.getElementById("breakMusic_currentAudio").textContent = "未設定";
    }

    if (!studyStartAudio || !breakStartAudio) {
        alert("アラーム音が設定されていません。画面下部の「アラーム音の設定」ボタンから、アラーム音を設定してください。");
    }
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
    const fileInput1 = document.getElementById("studyMusic");
    const fileInput2 = document.getElementById("breakMusic");
    if (fileInput1.files.length === 0 || fileInput2.files.length === 0) {
        alert("アラーム音を選択してください。");
        return;
    }
    fileInput1.disabled = true;
    fileInput2.disabled = true;

    if (studyStartAudio) {
        studyStartAudio.pause();
    }
    studyStartAudio = await saveAudio("studyMusic");
    studyStartAudio.load();
    
    if (breakStartAudio) {
        breakStartAudio.pause();
    }
    breakStartAudio = await saveAudio("breakMusic");
    breakStartAudio.load();

    fileInput1.disabled = false;
    fileInput2.disabled = false;
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
                            console.error("アラーム音の更新に失敗しました。");
                            alert("アラーム音の更新に失敗しました。しばらくしてから再度お試しください。");
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
                            console.error("アラーム音の登録に失敗しました。");
                            alert("アラーム音の更新に失敗しました。しばらくしてから再度お試しください。エラー内容: " + request.error);
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