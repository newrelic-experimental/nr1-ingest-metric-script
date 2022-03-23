var $http = require('request')
var assert = require('assert')
var Q = require('q')

//  EDIT THESE VARIABLES TO MEET YOUR NEEDS
var HOURS = 1
var QUERYKEY = 'NRIQ-XXXXXXXXXXXXXX'
var INSERTAPIKEY = 'NRII-XXXXXXXXXXXXXXXXX'
var ACCOUNTID = 'XXXXXXX'
var FACET_APM = 'appName'
var FACET_METRICS = 'appName'
var FACET_BROWSER = 'appName'
var FACET_TRACING = 'appName'
var FACET_INFRA_PROCESSES = 'hostname'
var FACET_LOGGING = 'labels.app'
var FACET_INFRA_HOSTS = 'hostname'
var FACET_PIXIE = 'k8s.cluster.name'
var FACET_NETWORK = 'instrumentation.name'
var FACET_MOBILE = 'appName'

// Multi-dimensional array [NRQL, TYPE, FACET_OBJECT] comma-delimited
var STATEMENTS = [
  ["SELECT bytecountestimate()/10e8 FROM Transaction, TransactionError FACET " + FACET_APM + " SINCE " + HOURS + " hours ago LIMIT MAX", "APM Events", FACET_APM],
  ["SELECT bytecountestimate()/10e8 FROM Metric WHERE instrumentation.provider != 'kentik' AND instrumentation.provider != 'pixie' FACET " + FACET_METRICS + " SINCE " + HOURS + " hours ago LIMIT MAX", "Metrics", FACET_METRICS],
  ["SELECT bytecountestimate()/10e8 FROM PageAction, JavaScriptError, PageView, AjaxRequest, PageViewTiming, BrowserInteraction, BrowserTiming, Ajax FACET " + FACET_BROWSER + " SINCE " + HOURS + " hours ago LIMIT MAX", "Browser Events", FACET_BROWSER],
  ["SELECT bytecountestimate()/10e8 FROM Span, ErrorTrace, SqlTrace WHERE instrumentation.provider != 'pixie' FACET " + FACET_TRACING + " SINCE " + HOURS + " hours ago LIMIT MAX", "Tracing", FACET_TRACING],
  ["SELECT bytecountestimate()/10e8 FROM ProcessSample FACET " + FACET_INFRA_PROCESSES + " SINCE " + HOURS + " hours ago LIMIT MAX", "Infrastructure Processes", FACET_INFRA_PROCESSES],
  ["SELECT bytecountestimate()/10e8 FROM Log, LogExtendedRecord WHERE instrumentation.provider != 'kentik' FACET " + FACET_LOGGING + " SINCE " + HOURS + " hours ago LIMIT MAX", "Logging", FACET_LOGGING],
  ["SELECT bytecountestimate()/10e8 FROM SystemSample, NetworkSample, StorageSample FACET " + FACET_INFRA_HOSTS + " SINCE " + HOURS + " hours ago LIMIT MAX", "Infrastructure Hosts", FACET_INFRA_HOSTS],
  ["SELECT bytecountestimate()/10e8 FROM Metric, Span WHERE instrumentation.provider = 'pixie' FACET " + FACET_PIXIE + " SINCE " + HOURS + " hours ago LIMIT MAX", "Pixie", FACET_PIXIE],
  ["SELECT bytecountestimate()/10e8 FROM Metric, KFlow, Log WHERE instrumentation.provider = 'kentik' FACET " + FACET_NETWORK + " SINCE " + HOURS + " hours ago LIMIT MAX", "Network Monitoring", FACET_NETWORK],
  ["SELECT bytecountestimate()/10e8 FROM Mobile, MobileActivityTrace, MobileBreadcrumb, MobileCrash, MobileHandledException, MobileRequest, MobileRequestError, MobileSession, MobileUserAction FACET " + FACET_MOBILE + " SINCE " + HOURS + " hours ago LIMIT MAX", "Mobile Events", FACET_MOBILE]
]

// Q.spawn() is not required but runs a generator function that automatically handles promise rejections on uncaught errors
Q.spawn(function * () {
  for (var index in STATEMENTS) {
    var NRQL = STATEMENTS[index][0]
    var TYPE = STATEMENTS[index][1]
    var FACET_OBJECT = STATEMENTS[index][2]
    call(NRQL, TYPE, FACET_OBJECT)
  }
})

function call (NRQL, TYPE, FACET_OBJECT) {
  // Reset array for each event
  var JSONARR = []

  // Callback
  var callback = function (error, response, body) {
    if (error) {
      console.log(error.stack)
    }
    assert.strictEqual(response.statusCode, 200, 'invalid response from insights')
    // console.log(body)

    // forEach refers to each objects in the facets array
    body.facets.forEach(function (bytecountestimate) {
      JSONARR.push({
        'metrics': [{
          'name': 'newrelic.ingest', // name of metric
          'type': 'gauge', // must be count, gauge, or summary
          'value': bytecountestimate.results[0].result, // checking for outcome
          'timestamp': Date.now(),
          'attributes': {
            [FACET_OBJECT]: bytecountestimate.name, // name of faceted object for each NRQL statement (e.g., appName)
            'ingestType': TYPE,
          }
        }]
      })
    })
    
    if (!Array.isArray(JSONARR) || !JSONARR.length) {
      console.log('Empty Array!')
    } else {
      console.log('---------------------------------------------------------------------')
      console.log(JSONARR)
      console.log('---------------------------------------------------------------------')
      // eslint-disable-next-line no-unused-vars
      var insertoptions = {
        method: 'POST',
        url: 'https://metric-api.newrelic.com/metric/v1',
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': INSERTAPIKEY,
          'Content-Encoding': 'Identity'
        },
        body: JSONARR
      }
      // ---------------------------------------------------------------------GO LIVE UNCOMMENT---------------------------------------------------------------------
       $http.post(insertoptions, function (error, response) {
       if (error) throw new Error(error)
       assert.strictEqual(response.statusCode, 202, 'invalid response from insights')
       })
    }
    return Q.Promise
  }
  var options = {
    url: 'https://insights-api.newrelic.com/v1/accounts/' + ACCOUNTID + '/query',
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'application/json',
      'X-Query-Key': QUERYKEY
    },
    qs: {
      'nrql': NRQL
    }
  }
  $http.get(options, callback)
}
