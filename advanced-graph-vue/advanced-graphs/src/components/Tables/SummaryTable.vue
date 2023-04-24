<template>
    <div class="tableContainer">
        <table>
            <tr class="header">
                <th>
                    <p>{{ category }}</p>
                </th>
                <th>
                    <p>{{ numeric}}</p>
                </th>
            </tr>
            <tr v-for="(row, index) in tableData" :key="index">
                <td>
                    <p>{{ row['category'] }}</p>
                </td>
                <td>
                    <p v-if="percents_or_totals == 'totals'">{{ row['count'] }}</p>
                    <p v-else-if="percents_or_totals == 'percents'">{{ d3.format(".0%")(row['percent']) }}</p>
                    <p v-else-if="percents_or_totals == 'both'">{{ row['count'] }} ({{ d3.format(".0%")(row['percent']) }})</p>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
    import * as d3 from "d3";

    import { parseChoicesOrCalculations, isCheckboxField, getCheckboxReport } from "@/utils.js";

    export default {
        name: "CrosstabTable",
        inject: ["module", "report", "data_dictionary"],
        props: {
            parameters: {
                type: Object,
                required: true,
            },
        },
        data() {
            // Get the choices for the categorical field
            var choices = parseChoicesOrCalculations(this.data_dictionary[this.parameters.categorical_field]);

            var this_report = this.report;

            // If the category is a checkbox field, get a checkbox field report
            if (isCheckboxField(this.parameters.categorical_field)) {
                this_report = getCheckboxReport(this.parameters.categorical_field);
            }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == this.parameters.instrument; }.bind(this));

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (this.parameters.na_category == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.categorical_field] != ''; }.bind(this));
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[this.parameters.categorical_field] == ""))
                // Add an NA category to choices
                choices[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.numeric_field] != ''; }.bind(this));
            }

            var barHeightFunction = function (d) { return d[this.parameters.numeric_field]; }.bind(this);

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'replace') {
                barHeightFunction = function (d) { return d[this.parameters.numeric_field] == '' ? this.parameters.na_numeric_value : d[this.parameters.numeric_field]; }.bind(this);
            }

            var counts = d3.rollup(filteredReport, v => v.length, d => d[this.parameters.categorical_field]);


            // If we are not using a numeric field, get the counts for each category
            if (!(this.parameters.is_count || this.parameters.numeric_field == '')) {
                counts = d3.rollup(filteredReport, v => d3[this.parameters.aggregation_function](v, barHeightFunction), d => d[this.parameters.categorical_field]);
            }


            // Flatten the counts and add a percents column by dividing the count by the sum of the counts
            var countsArray = Array.from(counts, ([category, count]) => ({ category: choices[category], count, percent: count / d3.sum(Array.from(counts, ([, count]) => count)) }));

            // If there are choices that are not in the report and unused categories is set to keep add them to the counts array
            if (this.parameters.unused_categories == 'keep') {
                for (var choice in choices) {
                    if (!countsArray.some(d => d.category == choices[choice])) {
                        countsArray.push({ category: choices[choice], count: 0, percent: 0 });
                    }
                }
            }

            // Add a total row to the counts array that takes the sum of the counts
            countsArray.push({ category: this.module.tt("total"), count: d3.sum(countsArray, d => d.count), percent: 1 });



            return {
                tableData: countsArray,
                category: this.data_dictionary[this.parameters.categorical_field].field_label,
                numeric: this.parameters.is_count ? this.module.tt("count") : this.data_dictionary[this.parameters.numeric_field].field_label,
                percents_or_totals: this.parameters.percents_or_totals,
                d3: d3,
            }
        }
    }
</script>

<style scoped>
    /* Make the table's height 480 and width 640 and make the table scrollable */
    .tableContainer {
        height: 480px;
        width: 640px;
        overflow: auto;
    }

    /* Center the table */
    table {
        margin-left: auto;
        margin-right: auto;
    }

    .header th {
        border: 1px solid black;

    }

    /* Add a border to the first column */
    table tr td:first-child {
        border-left: 1px solid black;
        border-right: 1px solid black;
        padding-right: 10px;
    }

    /* Add a border to the last row */
    table tr:last-child td {
        border-bottom: 1px solid black;
        border-top: 1px solid black;
        font-weight: bold;
    }

    /* Add a border to the last column */
    table tr td:last-child {
        border-right: 1px solid black;
    }

    /* Make the last cell red */
    table tr:last-child td:last-child {
        color: red;
    }

</style>