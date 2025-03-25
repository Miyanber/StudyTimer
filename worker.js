class Timer {
    /**
     * 内部処理は全て秒
     * @param {Number} timer_min タイマー時間(分)
     */
    constructor(timer_min) {
        this.timerDuration = timer_min * 60;
        this.startDateTime = new Date();
        this.TIMER_COUNT = this.timerDuration * 50;
        this.timerCount = this.timerDuration * 50;
        this.timerInterval = null;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {

            this.timerFunction();

            if (this.timerCount % 50 == 0) {
                let timerSeconds = this.timerDuration - Math.floor((new Date().getTime() - this.startDateTime.getTime()) / 1000);
                this.timerCount = timerSeconds * 50;
                postMessage({ name: "setTimerDisplay", param: timerSeconds })
            }

        }, 1000 / 50);
        if (this.TIMER_COUNT == this.timerCount) {
            postMessage({ name: "setTimerDisplay", param: this.timerDuration })
        }
    }

    pauseTimer() {
        clearInterval(this.timerInterval)
    }

    timerFunction() {
        return
    }
}

class StudyTimer extends Timer {
    timerFunction() {
        this.timerCount -= 1;
        if (this.timerCount == 0) {
            clearInterval(this.timerInterval);
            postMessage({ name: "to_break" });
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.timerCount) * 100) / 100;
        postMessage({ name: "circle_study", degree: degree });
    }
}

class BreakTimer extends Timer {
    timerFunction() {
        this.timerCount -= 1;
        if (this.timerCount == 0) {
            clearInterval(this.timerInterval);
            postMessage({ name: "to_study" });
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.timerCount) * 100) / 100;
        postMessage({ name: "circle_break", degree: degree });
    }
}

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
        default:
            break;
    }
}