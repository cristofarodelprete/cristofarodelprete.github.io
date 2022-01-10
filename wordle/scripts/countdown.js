var Countdown = (function() {
	function get(target, now) {
		if (typeof target == "string") target = Date.parse(target);
		if (typeof now == "undefined") now = new Date();
		let d = target - now;
		if (d < 0) d = 0;
		d = Math.round(d / 1000);
		let s = d % 60;
		d = Math.floor(d / 60);
		let m = d % 60;
		let h = Math.floor(d / 60);
		return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
	}

	function refresh() {
		var now = new Date();
		$("countdown").each(function(i, e) {
			$(e).text(get($(e).attr("target"), now));
		});
		setTimeout(refresh, 1000 - (+now % 1000));
	}
	
	$(document).ready(refresh);
	
	return {
		get: get
	};
})();