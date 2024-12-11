class Timer {
    /**
     * 内部処理は全て秒
     * @param {Number} timer_min タイマー時間(分)
     */
    constructor(timer_min) {
        this.timer_sec = timer_min * 60;
        this.TIMER_COUNT = this.timer_sec * 50;
        this.timer_count = this.timer_sec * 50;
        this.timer_interval = null;
    }

    startTimer() {
        const timer_interval = setInterval(() => {
            this.timer_function(timer_interval)
        }, 1000 / 50);
        this.timer_interval = timer_interval;
        if (this.TIMER_COUNT == this.timer_count) {
            postMessage({ name: "setTimerDisplay", param: this.timer_sec })
        }
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
            postMessage({ name: "to_break" });
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.timer_count) * 100) / 100;
        postMessage({ name: "circle_study", degree: degree });
        if (this.timer_count % 50 == 0) {
            let timer_sec = this.timer_count / 50;
            postMessage({ name: "setTimerDisplay", param: timer_sec })
        }
    }
}

class BreakTimer extends Timer {
    timer_function(timer_interval) {
        this.timer_count -= 1;
        if (this.timer_count == 0) {
            clearInterval(timer_interval);
            postMessage({ name: "to_study" });
        }
        const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.timer_count) * 100) / 100;
        postMessage({ name: "circle_break", degree: degree });
        if (this.timer_count % 50 == 0) {
            let timer_sec = this.timer_count / 50;
            postMessage({ name: "setTimerDisplay", param: timer_sec })
        }
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