const dateElement = document.getElementById("date");
const timeElement = document.getElementById("time");
const days = ['日', '月', '火', '水', '木', '金', '土']

function zeroPadding(number) {
    if (number < 0) {
        return number
    } else if (number < 10) {
        return `0${number}`;
    }
    return number;
}

setInterval(() => {
    const todayDate = new Date();
    dateElement.innerHTML
        = `令和<span class="highlight">${todayDate.getFullYear() - 2018}</span>年
    <span class="highlight">${todayDate.getMonth() + 1}</span>月<span class="highlight">${todayDate.getDate()}</span>日
    <span class="highlight">${days[todayDate.getDay()]}</span>曜日`;
    timeElement.innerHTML
        = `<span class="highlight">${todayDate.getHours()}</span>時 <span class="highlight">${zeroPadding(todayDate.getMinutes())}</span>分`;
}, 1000);

const studyCircle = document.querySelector("div.circle"),
    breakCircle = document.querySelector("div.circle_break"),
    minutes = document.querySelector("span.minutes"),
    seconds = document.querySelector("span.seconds"),
    toBreakNotification = document.getElementById("notification_to_break"),
    toStudyNotification = document.getElementById("notification_to_study"),
    startBreakButton = document.getElementById("start_break"),
    startStudyButton = document.getElementById("start_study"),
    popup = document.getElementById("popup"),
    popupYes = document.getElementById("popup_yes"),
    popupNo = document.getElementById("popup_no");


/** @type {HTMLAudioElement | null} */
let studyStartAudio = null
/** @type {HTMLAudioElement | null} */
let breakStartAudio = null;

/** @type {Timer | null} */
let timer = null;

const timerElement = document.getElementById("timer");
const timerStatus = document.getElementById("timer_status");
const deleteButton = document.getElementById("delete");
const saveButton = document.getElementById("save");
const studyDuration = document.getElementById("studyTime");
studyDuration.value = localStorage.getItem("defaultStudyDuration");
const breakDuration = document.getElementById("break_time");
breakDuration.value = localStorage.getItem("defaultBreakDuration");


class Timer {
    /**
     * @param {string} timerType タイマーの種類 `"study"` | `"break"`
     * @param {Number} duration タイマー時間 (分)
     * @param {boolean} restore タイマーをリストアするかどうか
     */
    constructor(timerType, duration, restore = false) {
        this.timerType = timerType;
        if (duration == 0 || duration == null) {
            this.duration = 1 / 60;
        } else {
            this.duration = duration;
        }
        this.timerStatus = "running";

        /** @type {Worker | null} */
        this.worker = new Worker("worker.js");
        this.worker.onmessage = async function (e) {
            switch (e.data.name) {
                case "timerExpired":
                    // インスタンス生成がまだのため（？）timerTypeはthis.で参照できない
                    if (timerType === "study") {
                        if (breakStartAudio) {
                            await breakStartAudio.play();
                        }
                        toBreakNotification.classList.add("active");
                        toBreakNotification.classList.remove("hidden");
                    } else {
                        if (studyStartAudio) {
                            await studyStartAudio.play();
                        }
                        toStudyNotification.classList.add("active");
                        toStudyNotification.classList.remove("hidden");
                    }
                    timer.timerStatus = "expired";
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
                    updateTimeLeft(e.data.timerSeconds);
                    timer.backupTimer(e.data.backupData);
                    break;
                default:
                    break;
            }
        }

        if (restore) {
            // タイマーをリストアする場合は後でrestoreTimerを実行
            return;
        }

        this.worker.postMessage({ name: "startTimer", duration: this.duration });
        requestWakeLock();
        timerStatus.classList.remove("restart");
        timerStatus.classList.add("pause");
        timerStatus.textContent = "一時停止";
        deleteButton.disabled = true;
        studyDuration.disabled = true;
        breakDuration.disabled = true;
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
        this.terminateWorker();
        timerStatus.classList.remove("restart");
        timerStatus.textContent = "タップして開始";
        studyDuration.disabled = false;
        breakDuration.disabled = false;
        studyCircle.style.background =
            `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
        breakCircle.style.background =
            `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
        this.timerStatus = "expired";
        localStorage.removeItem("workerTimerBackupData");
        localStorage.removeItem("timerBackupData");
    }

    getTimerStatus() {
        return this.timerStatus;
    }

    backupTimer(workerTimerBackupData) {
        const timerBackupData = {
            timerType: this.timerType,
            duration: this.duration,
            timerStatus: this.timerStatus,
            studyDuration: studyDuration.value,
            breakDuration: breakDuration.value,
            studyCircleStyle: studyCircle.style.background,
            breakCircleStyle: breakCircle.style.background,
        };
        localStorage.setItem("workerTimerBackupData", JSON.stringify(workerTimerBackupData));
        localStorage.setItem("timerBackupData", JSON.stringify(timerBackupData));
    }

    restoreTimer(workerTimerBackupData, timerBackupData) {
        this.timerType = timerBackupData.timerType;
        this.duration = timerBackupData.duration;
        this.timerStatus = timerBackupData.timerStatus;
        studyCircle.style.background = timerBackupData.studyCircleStyle;
        breakCircle.style.background = timerBackupData.breakCircleStyle;
        updateTimeLeft(Math.floor(workerTimerBackupData.remainingTimerTicks / 50))
        this.worker.postMessage({ name: "restoreTimer", workerTimerBackupData: workerTimerBackupData, timerStatus: timerBackupData.timerStatus });
        if (timerBackupData.timerStatus === "running") {
            requestWakeLock();
            timerStatus.classList.remove("restart");
            timerStatus.classList.add("pause");
            timerStatus.textContent = "一時停止";
            deleteButton.disabled = true;
            studyDuration.disabled = true;
            breakDuration.disabled = true;
        } else if (timerBackupData.timerStatus === "pausing") {
            this.pauseTimer();
        } else if (timerBackupData.timerStatus === "expired") {
            if (timerBackupData.timerType === "study") {
                toBreakNotification.classList.remove("hidden");
                toBreakNotification.classList.add("active");
            } else {
                toStudyNotification.classList.remove("hidden");
                toStudyNotification.classList.add("active");
            }
        }
    }

    terminateWorker() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}

function timerRestorePopup() {
    return new Promise((resolve) => {
        popup.classList.add("active");
        popupYes.addEventListener("click", () => {
            resolve(true);
            popup.classList.remove("active");
        }, { once: true })
        popupNo.addEventListener("click", () => {
            resolve(false);
            popup.classList.remove("active");
        }, { once: true });
    });
}

async function restoreTimer() {
    let workerTimerBackupData = localStorage.getItem("workerTimerBackupData");
    let timerBackupData = localStorage.getItem("timerBackupData");
    if (workerTimerBackupData && timerBackupData) {
        if (await timerRestorePopup()) {
            workerTimerBackupData = JSON.parse(workerTimerBackupData);
            timerBackupData = JSON.parse(timerBackupData);
            timer = new Timer(timerBackupData.timerType, Number(timerBackupData.duration), true);
            timer.restoreTimer(workerTimerBackupData, timerBackupData);
            studyDuration.value = timerBackupData.studyDuration;
            breakDuration.value = timerBackupData.breakDuration;
            return true;
        } else {
            localStorage.removeItem("workerTimerBackupData");
            localStorage.removeItem("timerBackupData");
        }
    }
    return false;
}

function updateTimeLeft(timerSeconds) {
    if (timerSeconds >= 0) {
        minutes.textContent = zeroPadding(Math.floor(timerSeconds / 60));
    } else {
        minutes.textContent = zeroPadding(-Math.floor(Math.abs(timerSeconds / 60)));
    }
    seconds.textContent = zeroPadding(timerSeconds % 60);
}

startBreakButton.addEventListener("click", () => {
    breakStartAudio.pause();
    breakStartAudio.currentTime = 0;
    toBreakNotification.classList.add("hidden");
    toBreakNotification.classList.remove("active");
    timer.terminateWorker();
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
    timer.terminateWorker();
    timer = new Timer("study", studyDuration.value);
});

studyDuration.addEventListener("input", () => {
    updateTimeLeft(studyDuration.value * 60);
});

deleteButton.addEventListener("click", () => {
    timer.resetTimer();
    updateTimeLeft(studyDuration.value * 60);
});

saveButton.addEventListener("click", () => {
    // 設定を保存
    localStorage.setItem("defaultStudyDuration", studyDuration.value);
    localStorage.setItem("defaultBreakDuration", breakDuration.value);
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

    const promises = [
        new Promise(async (resolve, reject) => {
            studyStartAudio = await getAudio("studyMusic");
            if (!studyStartAudio) {
                document.getElementById("studyMusic_currentAudio").textContent = "未設定";
            }
            resolve();
        }),
        new Promise(async (resolve, reject) => {
            breakStartAudio = await getAudio("breakMusic");
            if (!breakStartAudio) {
                document.getElementById("breakMusic_currentAudio").textContent = "未設定";
            }
            resolve();
        }),
    ]

    await Promise.all(promises);

    if (!studyStartAudio || !breakStartAudio) {
        alert("アラーム音が設定されていません。画面下部の「アラーム音の設定」ボタンから、アラーム音を設定してください。");
    } else {
        const shouldRestoreTimer = await restoreTimer();
        if (!shouldRestoreTimer) {
            updateTimeLeft(studyDuration.value * 60);
            timerStatus.textContent = "タップして開始";
        }
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
            if (!studyStartAudio || !breakStartAudio) {
                alert("アラーム音が設定されていません。画面下部の「アラーム音の設定」ボタンから、アラーム音を設定してください。");
            } else {
                timer = new Timer("study", studyDuration.value);
            }
        });
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


//### ここから 「試験」機能 ###
const startExamButton = document.getElementById("startExam");
const examStartTimeElement = document.getElementById("examStartTime");
const examEndTimeElement = document.getElementById("examEndTime");

let examEndTime = null;

startExamButton.addEventListener("click", () => {
    const examDuration = document.getElementById("examTime").value;
    if (examDuration == 0 || examDuration == null) {
        alert("試験時間を設定してください。");
        return;
    }
    const now = new Date();
    examEndTime = new Date(new Date().getTime() + examDuration * 60 * 1000);
    examStartTimeElement.innerHTML = `<span class="highlight">${zeroPadding(now.getHours())}:${zeroPadding(now.getMinutes())}</span>${zeroPadding(now.getSeconds())}`;
    examEndTimeElement.innerHTML = `<span class="highlight">${zeroPadding(examEndTime.getHours())}:${zeroPadding(examEndTime.getMinutes())}</span>${zeroPadding(examEndTime.getSeconds())}`;
});

setInterval(() => {
    const now = new Date();
    if (examEndTime && now.getTime() >= examEndTime.getTime()) {
        alert("試験時間が終了しました。");
        examEndTime = null;
        return;
    }
}, 1000);
//### ここまで 「試験」機能 ###