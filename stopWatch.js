const stopWatch = document.querySelector('.stopwatch');
const startStopWatchButton = document.querySelector('.stopWatch__container__buttons>.start');
const pauseStopWatchButton = document.querySelector('.stopWatch__container__buttons>.pause');
const resetStopWatchButton = document.querySelector('.stopWatch__container__buttons>.reset');
const stopWatchScreenElements = {
    hours: document.querySelector(".stopWatch__container__screen>.hours"),
    minutes: document.querySelector(".stopWatch__container__screen>.minutes"),
    seconds: document.querySelector(".stopWatch__container__screen>.seconds")
}
let stopWatchInterval, stopWatchMilliSeconds = 0;
startStopWatchButton.addEventListener("click", (e) => {
    stopWatchInterval = setInterval(() => {
        stopWatchMilliSeconds += 1;
        updateStopWatchScreen();
    }, 20);
    startStopWatchButton.textContent = "START";
    startStopWatchButton.hidden = true;
    pauseStopWatchButton.hidden = false;
    resetStopWatchButton.hidden = true;
})
pauseStopWatchButton.addEventListener("click", (e) => {
    clearInterval(stopWatchInterval);
    startStopWatchButton.textContent = "RESUME";
    startStopWatchButton.hidden = false;
    pauseStopWatchButton.hidden = true;
    resetStopWatchButton.hidden = false;
})
resetStopWatchButton.addEventListener("click", (e) => {
    clearInterval(stopWatchInterval);
    stopWatchMilliSeconds = 0;
    updateStopWatchScreen();
    startStopWatchButton.textContent = "START";
    startStopWatchButton.hidden = false;
    pauseStopWatchButton.hidden = true;
    resetStopWatchButton.hidden = true;
})

function updateStopWatchScreen() {
    const stopWatchSeconds = Math.floor(stopWatchMilliSeconds / 50);
    const hours = Math.floor(stopWatchSeconds / 3600);
    const minutes = Math.floor((stopWatchSeconds % 3600) / 60);
    const seconds = stopWatchSeconds % 60;
    stopWatchScreenElements.hours.textContent = hours;
    stopWatchScreenElements.minutes.textContent = zeroPadding(minutes);
    stopWatchScreenElements.seconds.textContent = zeroPadding(seconds);
}