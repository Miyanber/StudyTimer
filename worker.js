class WorkerTimer {
    /**
     * 内部処理は全て秒
     * @param {Number} timerDuration タイマー時間(分)
     */
    constructor(timerDuration, workerTimerBackupData = null, timerStatus = null) {
        if (!workerTimerBackupData) {
            this.timerDuration = timerDuration * 60;
            this.startTime = new Date().getTime();
            this.TIMER_COUNT = this.timerDuration * 50;
            this.remainingTimerTicks = this.timerDuration * 50;
            this.setTimerInterval();
        } else {
            this.timerDuration = Number(workerTimerBackupData.timerDuration);
            this.startTime = Number(workerTimerBackupData.startTime);
            this.TIMER_COUNT = Number(workerTimerBackupData.TIMER_COUNT);
            this.remainingTimerTicks = Number(workerTimerBackupData.remainingTimerTicks);
            if (timerStatus === "running") {
                console.log("resume")
                this.setTimerInterval();
            }
        }
    }

    resumeTimer() {
        this.startTime = new Date().getTime() - Math.floor((this.TIMER_COUNT - this.remainingTimerTicks) / 50 * 1000);
        this.setTimerInterval();
    }

    pauseTimer() {
        // 意図的にBackup処理を走らせている
        postMessage({ name: "updateTimeLeft", timerSeconds: Math.floor(this.remainingTimerTicks / 50) + 1, backupData: this.getBackupData() })
        clearInterval(this.timerInterval);
    }

    setTimerInterval() {
        this.timerInterval = setInterval(() => {
            if (this.remainingTimerTicks == this.TIMER_COUNT) {
                postMessage({ name: "updateTimeLeft", timerSeconds: this.timerDuration, backupData: this.getBackupData() })
            }

            this.remainingTimerTicks -= 1;

            if (this.remainingTimerTicks % 50 == 0) {
                let timerSeconds = this.timerDuration - Math.floor((new Date().getTime() - this.startTime) / 1000);
                this.remainingTimerTicks = timerSeconds * 50;
                postMessage({ name: "updateTimeLeft", timerSeconds: timerSeconds, backupData: this.getBackupData() })
            }

            if (this.remainingTimerTicks <= 0) {
                // clearInterval(this.timerInterval);
                postMessage({ name: "timerExpired" });
            }

            const degree = 360 - Math.floor((360 / this.TIMER_COUNT * this.remainingTimerTicks) * 100) / 100;
            postMessage({ name: "updateProgress", degree: degree });

        }, 1000 / 50);
    }

    getBackupData() {
        return {
            timerDuration: this.timerDuration,
            startTime: this.startTime,
            TIMER_COUNT: this.TIMER_COUNT,
            remainingTimerTicks: this.remainingTimerTicks,
        }
    }
}

/** @type {WorkerTimer} */
let workerTimer;

onmessage = function (e) {
    switch (e.data.name) {
        case "startTimer":
            workerTimer = new WorkerTimer(e.data.duration);
            break;
        case "pauseTimer":
            workerTimer.pauseTimer();
            break;
        case "resumeTimer":
            workerTimer.resumeTimer();
            break;
        case "restoreTimer":
            workerTimer = new WorkerTimer(0, e.data.workerTimerBackupData, e.data.timerStatus);
        default:
            break;
    }
}