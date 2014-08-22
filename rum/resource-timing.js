function measureResources() {
	if ( !window.performance || !window.performance.getEntriesByType ) {
        // Bail if Resource Timing is not supported.
		return;
    }

	// This array will be populated dynamically by some backend code.
	var aDomains = ["*.stevesouders.com", "spriteme.org", "ajax.googleapis.com"];
	var numDomains = aDomains.length;

	if ( numDomains < 1 ) {
		// if there are no domains to check then bail
		return;
	}
	// Handle wildcard domains: we convert the domain names to regex format.
	for ( var i = 0; i < numDomains; i++ ) {
		var domain = aDomains[i];
		if ( 0 === domain.indexOf("*.") ) {
			// If there's a wildcard we have to add a new domain for JUST the top- & second-level-domain values.
			aDomains.push("^" + domain.replace(/^\*\./, "") + "$");
		}
		aDomains[i] = "^" + domain.replace(/\./g, "\\.").replace(/^\*\\\./, ".*\\.") + "$"; // backslash all "." and change "*." to "."
	}
	numDomains = aDomains.length; // update the value

    // send back the timing of each request on the desired domains
	var aDns = [], aSsl = [], aTcp = [], aTtfb = [], aDur = [];  // store time measurements
    var aEntries = performance.getEntriesByType("resource");
    var len = aEntries.length;
	var a = document.createElement('a'); // we re-use this anchor element to help parse URLs
    for ( var i = 0; i < len; i++ ) {
        var entry = aEntries[i];
 		a.href = entry.name; // do this for easier parsing
		var hostname = a.hostname;
		for ( var j = 0; j < numDomains; j++ ) {
			if ( hostname.match(aDomains[j]) ) {
				aDur.push( Math.round(entry.duration) ); // we ALWAYS have a duration
				var sOut = entry.name + ":<br>&nbsp;&nbsp;&nbsp;&nbsp;dur=" + Math.round(entry.duration);
				// Make sure we have data that's occluded for cross-domain resources missing Timing-Allow-Origin header.
				if ( 0 != entry.requestStart ) {
					aDns.push( Math.round(entry.domainLookupEnd - entry.domainLookupStart) );
					sOut += ", dns=" +  Math.round(entry.domainLookupEnd - entry.domainLookupStart);
					aTcp.push( Math.round(entry.connectEnd - entry.connectStart) );
					sOut += ", tcp=" +  Math.round(entry.connectEnd - entry.connectStart);
					if ( entry.secureConnectionStart ) {
						aSsl.push( Math.round(entry.connectEnd - entry.secureConnectionStart) );
						sOut += ", ssl=" +  Math.round(entry.connectEnd - entry.secureConnectionStart);
					}
					aTtfb.push( Math.round(entry.responseStart - entry.startTime) );
					sOut += ", ttfb=" +  Math.round(entry.responseStart - entry.startTime);
				}
				dprint(sOut);
				break;
			}
		}
    }

	/* CVSNO
	dprint("DNS: " + aDns.join(", "));
	dprint("TCP: " + aTcp.join(", "));
	dprint("SSL: " + aSsl.join(", "));
	dprint("TTFB: " + aTtfb.join(", "));
	dprint("dur: " + aDur.join(", "));
	*/

	// compute aggregate stats
	var hResults = {};
	aggStats(hResults, 'dns', aDns);
	aggStats(hResults, 'tcp', aTcp);
	aggStats(hResults, 'ssl', aSsl);
	aggStats(hResults, 'ttfb', aTtfb);
	aggStats(hResults, 'dur', aDur);

	dprint("<br><br>" + JSON.stringify(hResults));
};


function aggStats(h, name, a) {
	h[name] = {};
	h[name]['num'] = a.length;
	if ( a.length ) {
		a.sort(sortDesc);
		h[name]['max'] = arrayMax(a, true);
		h[name]['med'] = arrayMed(a, true);
		h[name]['avg'] = arrayAvg(a);
	}

}


// use this with the array sort() function to sort numbers
function sortDesc(a,b) {
	return b - a;
}


// return the max value from an array
// if bDesc == true then the array is presumed to be in descending order
function arrayMax(a, bDesc) {
	return ( bDesc ? a[0] : a.sort(sortDesc)[0] );
}


// return the median value from an array
// if bDesc == true then the array is presumed to be in descending order
function arrayMed(a, bDesc) {
	if ( ! bDesc ) {
		a.sort(sortDesc);
	}

	var len = a.length;
	if ( 0 == len ) {
		return undefined;
	}

	var middle = Math.floor(len / 2);
	if ( 2*middle == len ) {
		// even number of elements
		return Math.round( (a[middle-1] + a[middle])/2 );
	}
	else {
		// odd number of elements
		return a[middle];
	}
}


// return the average of an array of numbers
function arrayAvg(a) {
	var len = a.length;
	var sum = 0;
	for ( var i = 0; i < len; i++ ) {
		sum += a[i];
	}

	return Math.round(sum/len);
}

function dprint(msg) {
	document.getElementById("results").innerHTML += msg + "<br>";
}

