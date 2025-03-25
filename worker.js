class WorkerTimer {
    /**
     * 内部処理は全て秒
     * @param {Number} timer_min タイマー時間(分)
     */
    constructor(timer_min) {
        this.timerDuration = timer_min * 60;
        this.startTime = new Date().getTime();
        this.TIMER_COUNT = this.timerDuration * 50;
        this.remainingTimerTicks = this.timerDuration * 50;
        this.timerInterval = null;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {

            this.timerFunction();

            if (this.remainingTimerTicks % 50 == 0) {
                let timerSeconds = this.timerDuration - Math.floor((new Date().getTime() - this.startTime) / 1000);
                this.remainingTimerTicks = timerSeconds * 50;
                postMessage({ name: "setTimerDisplay", param: timerSeconds })
            }

        }, 1000 / 50);
    }

    resumeTimer() {
        this.startTime = new Date().getTime() - Math.floor((this.TIMER_COUNT - this.remainingTimerTicks) / 50 * 1000);
        this.startTimer();
    }

    pauseTimer() {
        clearInterval(this.timerInterval);
    }

    timerFunction() {
        return
    }
}

class StudyTimer extends WorkerTimer {
    timerFunction() {
        this.remainingTimerTicks -= 1;
        if (this.remainingTimerTicks <= 0) {
            clearInterval(this.timerInterval);
            postMessage({ name: "to_break" });
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.remainingTimerTicks) * 100) / 100;
        postMessage({ name: "circle_study", degree: degree });
    }
}

class BreakTimer extends WorkerTimer {
    timerFunction() {
        this.remainingTimerTicks -= 1;
        if (this.remainingTimerTicks == 0) {
            clearInterval(this.timerInterval);
            postMessage({ name: "to_study" });
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.remainingTimerTicks) * 100) / 100;
        postMessage({ name: "circle_break", degree: degree });
    }
}

/** @type {WorkerTimer} */
let timer;

onmessage = function (e) {
    switch (e.data.name) {
        case "setTimer_study":
            timer = new StudyTimer(e.data.timer_sec);
            break;
        case "setTimer_break":
            timer = new BreakTimer(e.data.timer_sec);
            break;
        case "startTimer":
            timer.startTimer();
            break;
        case "pauseTimer":
            timer.pauseTimer();
            break;
        case "resumeTimer":
            timer.resumeTimer();
            break;
        default:
            break;
    }
}