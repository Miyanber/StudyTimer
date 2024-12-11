const div_circle_study = document.querySelector("div.circle"),
    div_circle_break = document.querySelector("div.circle_break"),
    minutes = document.querySelector("span.minutes"),
    seconds = document.querySelector("span.seconds"),
    notification_to_break = document.getElementById("notification_to_break"),
    notification_to_study = document.getElementById("notification_to_study"),
    start_break_button = document.getElementById("start_break"),
    start_study_button = document.getElementById("start_study"),
    start_study_audio = new Audio("./mp3/We Will Rock You.mp3"),
    start_break_audio = new Audio("./mp3/Seven Seas Of Rhye - Remastered 2011.mp3");

class Timer {
    /**
     * 内部処理は全て秒
     * @param {Number} timer_min タイマー時間(分)
     */
    constructor(timer_min) {
        const timer_sec = timer_min * 60;
        this.TIMER_COUNT = timer_sec * 50;
        this.timer_count = timer_sec * 50;
        this.timer_interval = null;
    }

    startTimer() {
        const timer_interval = setInterval(() => {
            this.timer_function(timer_interval)
        }, 1000 / 50);
        this.timer_interval = timer_interval;
        if (this.TIMER_COUNT == this.timer_count) {
            setTimerDisplay(this.TIMER_COUNT / 50);
        }
    }

    startTimerOnWorker() {
        // これをWorker上で実行する。
        setInterval(() => {
            this.timer_count -= 1;
        }, 1000 / 50);
    }

    pauseTimer() {
        clearInterval(this.timer_interval)
    }

    timer_function(timer_interval) {
        return
    }
}

class StudyTimer extends Timer {
    timer_function(timer_interval) {
        this.timer_count -= 1;
        if (this.timer_count == 0) {
            clearInterval(timer_interval);
            notification_to_break.classList.remove("hidden");
            start_break_audio.play();
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.timer_count) * 100) / 100;
        div_circle_study.style.background =
            `conic-gradient(#799aff 0deg ${degree}deg, #333 ${degree}deg 360deg)`;
        if (this.timer_count % 50 == 0) {
            let timer_sec = this.timer_count / 50;
            setTimerDisplay(timer_sec);
        }
    }
}

class BreakTimer extends Timer {
    timer_function(timer_interval) {
        this.timer_count -= 1;
        if (this.timer_count == 0) {
            clearInterval(timer_interval);
            notification_to_study.classList.remove("hidden");
            start_study_audio.play();
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.timer_count) * 100) / 100;
        div_circle_break.style.background =
            `conic-gradient(#ff6060 0deg ${degree}deg, #505050 ${degree}deg 360deg)`;
        if (this.timer_count % 50 == 0) {
            let timer_sec = this.timer_count / 50;
            setTimerDisplay(timer_sec);
        }
    }
}

function setTimerDisplay(timer_sec) {
    let timer_min = Math.floor(timer_sec / 60);
    let digits = 2;
    if (timer_sec >= 100 * 60) digits = 3;
    minutes.textContent = ("00" + timer_min).slice(-digits);
    seconds.textContent = `:${("00" + (timer_sec % 60)).slice(-2)}`;
}

const start_or_pause_button = document.getElementById("start_pause");
const delete_button = document.getElementById("delete");
const study_time = document.getElementById("study_time");
study_time.value = localStorage.getItem("study_time");
const break_time = document.getElementById("break_time");
break_time.value = localStorage.getItem("break_time");
setTimerDisplay(study_time.value * 60);

let timer = new Timer(0);

study_time.addEventListener("input", () => {
    setTimerDisplay(study_time.value * 60);
})

start_or_pause_button.addEventListener("click", () => {
    if (start_or_pause_button.classList.contains("restart")) {
        timer.startTimer();
        start_or_pause_button.classList.remove("restart");
        start_or_pause_button.classList.add("pause");
        start_or_pause_button.textContent = "一時停止";
        delete_button.disabled = true;
    } else if (start_or_pause_button.classList.contains("pause")) {
        // 
        timer.pauseTimer();
        start_or_pause_button.classList.add("restart");
        start_or_pause_button.classList.remove("pause");
        start_or_pause_button.textContent = "再開";
        delete_button.disabled = false;
    } else {
        // 開始
        start_or_pause_button.classList.add("pause");
        start_or_pause_button.textContent = "一時停止";
        timer = new StudyTimer(study_time.value);
        timer.startTimer();
        study_time.disabled = true;
        break_time.disabled = true;
        delete_button.disabled = true;
        delete_button.classList.remove("save");
        delete_button.textContent = "リセット";
    }
})

start_or_pause_button.addEventListener("click", () => {
    start_break_audio.load();
    start_study_audio.load();
}, { once: true })

delete_button.addEventListener("click", () => {
    if (delete_button.classList.contains("save")) {
        // 設定を保存
        localStorage.setItem("study_time", study_time.value);
        localStorage.setItem("break_time", break_time.value);
        alert("勉強・休憩時間の設定がブラウザに保存されました。")
    } else {
        // リセット
        start_or_pause_button.classList.remove("restart");
        start_or_pause_button.textContent = "開始";
        delete_button.classList.add("save");
        delete_button.textContent = "設定を保存";
        study_time.disabled = false;
        break_time.disabled = false;
        div_circle_study.style.background =
            `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
        div_circle_break.style.background =
            `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
        setTimerDisplay(study_time.value * 60);
    }
})

start_break_button.addEventListener("click", () => {
    start_break_audio.pause();
    start_break_audio.currentTime = 0;
    notification_to_break.classList.add("hidden");
    timer = new BreakTimer(break_time.value);
    timer.startTimer();
})

start_study_button.addEventListener("click", () => {
    start_study_audio.pause();
    start_study_audio.currentTime = 0;
    notification_to_study.classList.add("hidden");
    div_circle_study.style.background =
        `conic-gradient(#799aff 0deg 0deg, #333 0deg 360deg)`;
    div_circle_break.style.background =
        `conic-gradient(#ff6060 0deg 0deg, #505050 0deg 360deg)`;
    timer = new StudyTimer(study_time.value);
    timer.startTimer();
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
