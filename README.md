[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# nr1-ingest-metric-script
Create custom metric via synthetic script to capture New Relic ingest.

Use this script to set up a synthetic monitor that:
1. Queries ingestion by data source, faceted by the attribute of your choice (e.g., `APM Events` by `appName`).
2. Transforms the output into a metric that is pushed to the Metric API.
3. Can be queried for consumption analysis and dashboards for 13 months.

## Purpose
Consumption-based pricing has motivated New Relic users to analyze data ingest more closely and identify opportunities to optimize. That is, help them understand:

-  What are we sending?
- Is it valuable?
- Are we sending more this month than we did last month?

Due to the 8-day default retention for event data, our users’ ability to understand ingest over periods longer than that is limited. For customers sending large volumes of a particular event, even querying the last 8 days may not be possible.

This script can be configured as a synthetic monitor to periodically query ingest and post it as a custom metric for longer storage, and thus, long-term querying and analysis.

![148800863-e10d8c8f-aeee-43bc-82bb-790a4131b98b](https://user-images.githubusercontent.com/68360819/159800504-4ee62f26-2a1c-45d3-9b53-a4d738081e5b.png)


## Getting started
Copy the `ingest-metric-script-example.js` file and update as indicated below:

1. Update the `QUERYKEY`, `INSERTAPIKEY`, and `ACCOUNTID` variables.
2. Optionally, update the `HOURS` variable to set the time interval for the query. That is, do you want to capture data ingestion for the past 1, 24, or 168 hours? By default, it's set to `1`.
3. Optionally, update the faceted attribute used for each query such as `FACET_METRICS`, `FACET_BROWSER`, or `FACET_TRACING`. The default values are:
   - APM Events: `appName`
   - Metrics: `appName`
   - Browser Events: `appName`
   - Tracing: `appName`
   - Mobile Events: `appName`
   - Infrastructure Processes: `hostname`
   - Infrastructure Hosts: `hostname`
   - Logging: `labels.app`
   - Pixie: `k8s.cluster.name`
   - Networking Monitoring: `instrumentation.name`

4. Optionally, update the `name` parameter within the metric payload. By default, it's set to `newrelic.ingest`.

> 💡 You don't need to remove the queries for data types not present in the account. If the query returns an empty array, it will skip to the next query without printing the prior empty result.

## Installation

Once you've updated the script according to your needs, create the monitor as follows:
1. Select Endpoint availability (Scripted API).
2. Select Node 10 Runtime.
3. Name your monitor and configure the Period.
4. Select a location (any but only _one_).
5. Validate the script and confirm there are no errors.
6. Save the monitor.
7. Run a test check and view data by querying:
   ```sql
   FROM Metric SELECT * WHERE metricName='newrelic.ingest'
   ```

Filter on data types by using the `ingestType` attribute.

> 💡 The Period you configure when setting up the script should match the value you set in the script’s `HOURS` variable - i.e., if the script is set to query ingest for the past hour (i.e., `HOURS` = 1), the script should run every hour so that the results also correspond to ingestion for the past hour.

## Including custom events

You can also update the script to include any custom events in your data ingestion metric. Within the `STATEMENTS` multi-dimensional array, add an additional array that includes the following two elements, delimited by commas:
1. A query that returns data ingestion estimate for each custom event.
2. A label for the `ingestType`.

For example:
```sql
SELECT bytecountestimate()/10e8 FROM “Purchase” SINCE “ + HOURS + “ hours ago LIMIT MAX”, “Custom Events”
```

Optionally, if you also want to facet on the custom events, add this as the last element in the array and define within the list of `VARIABLES` that third variable for the custom event’s faceted attribute. For example, 

```js
var FACET_CUSTOMEVENTS = 'payment.processor’
```

Query example:
```sql
SELECT bytecountestimate()/10e8 FROM “Purchase” SINCE “ + HOURS + “ hours ago LIMIT MAX”, “Custom Events”, FACET_CUSTOMEVENTS
```

## Dashboard

A dashboard for the custom metric is available in `dashboard.json`
![ingest-infrahosts](https://user-images.githubusercontent.com/68360819/151472717-39152e08-c9f3-4cf9-9517-a63b73a6643d.png)


## Support
New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

>https://discuss.newrelic.com/t/quickstart-ingest-metric-script/179865

### Issues and enhancement requests
Issues and enhancement requests can be submitted in the Issues tab of this repository. Please search for and review the existing open issues before submitting a new issue.

## Contributing
We encourage your contributions to improve nr1-ingest-metric-script! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project.
If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company,  please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## License
nr1-ingest-metric-script is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
