export default (performance && performance.now) ? function () { return performance.now(); } : Date.now;
