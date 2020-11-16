class RunOnInterval {
  constructor(interval_in_ms, function_to_run, { run_now = false, run_once = false, timezone_offset = new Date().getTimezoneOffset() * 6e4 } = {}) {
    if (run_now) function_to_run();
    // "Private" fields
    this.__timeout = 0;
    this.__running = false;
    this.__states = {
      true: 'running',
      false: 'paused',
    };
    this.__timezone_offset = timezone_offset;
    this.__interval_in_ms = +interval_in_ms;
    this.__function_to_run = function_to_run;
    this.__run_once = !!run_once;

    // Start the initial run
    this.start();
  }

  __calculateTimeout() {
    return this.__interval_in_ms - (Date.now() - this.__timezone_offset) % this.__interval_in_ms;
  }

  // define our getters and setters
  get interval_in_ms(){
    return this.__interval_in_ms;
  }

  set interval_in_ms(v){
    if (isNaN(+v)) return;
    // Set interval, restart timeout
    this.__interval_in_ms = +v;
    this.start();
  }

  get function_to_run(){
    return this.__function_to_run;
  }

  set function_to_run(f){
    if (typeof f !== 'function') return;
    this.__function_to_run = f;
    this.start();
  }

  get run_once(){
    return this.__run_once;
  }

  set run_once(v){
    this.__run_once = !!v;
  }

  start() {
    // Remove any old timeouts
    clearTimeout(this.__timeout);
    // Wait until we reach the specified timeout
    this.__timeout = setTimeout(() => {
      this.__function_to_run();
      if (!this.__run_once) this.start();
      else this.pause();
    }, this.__calculateTimeout());
    // Set state to running
    this.__running = true;
  }

  pause() {
    clearTimeout(this.__timeout);
    this.__running = false;
  }

  stop() {
    this.pause();
  }

  // Only getters no setters
  get running(){
    return this.__running;
  }

  get state(){
    return this.__states[this.__running];
  }

  get timeleft(){
    return this.__running ? this.__calculateTimeout() : false;
  }

  get timeleftString(){
    const timeleft = this.timeleft;
    if (!timeleft) return false;
    const timeleftDate = new Date(timeleft);

    let str = '';

    if (timeleft >= 24 * 60 * 6e4) str += `${timeleftDate.getUTCDate() - 1} Days `;
    if (timeleft >= 60 * 6e4) str += `${timeleftDate.getUTCHours()} Hours `;
    if (timeleft >= 6e4) str += `${timeleftDate.getMinutes()} Minutes `;
    str += `${timeleftDate.getSeconds()} Seconds`;

    return str;
  }
}

module.exports = { RunOnInterval };
