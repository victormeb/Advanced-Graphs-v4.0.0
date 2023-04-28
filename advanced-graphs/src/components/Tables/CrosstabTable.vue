<template>
    <div>
        <table class="AG-cross-tab">
            <tr>
                <th></th>
                <th  class="header" :colspan="column_categories.length">
                    {{ category_two }}
                </th>
            </tr>
            <tr>
                <th class="header"> {{ category_one }}</th>
                <td v-for="(category, index) in column_categories" :key="index">
                    {{ choices_two[category] }}
                </td>
                <th>{{module.tt('table_total')}}</th>
            </tr>
            <tr v-for="(row, row_categories, index) in tableData" :key="index">
                <td>
                    <p>{{ choices_one[row_categories] }}</p>
                </td>
                <td v-for="(value,column) in row" :key="column">
                    <p v-if="percents_or_totals == 'totals'">{{ value.value }}</p>
                    <p v-else-if="percents_or_totals == 'percents'">{{ d3.format(".0%")(value[attributeType]) }}</p>
                    <p v-else-if="percents_or_totals == 'both'">{{ value.value }} ({{ d3.format(".0%")(value[attributeType]) }})</p>
                </td>
                <!-- Total column -->
                <td class="column-total">
                    <p v-if="percents_or_totals == 'totals'">{{ totalColumn[row_categories].value }}</p>
                    <p v-else-if="percents_or_totals == 'percents'">{{ d3.format(".0%")(totalColumn[row_categories][attributeType]) }}</p>
                    <p v-else-if="percents_or_totals == 'both'">{{ totalColumn[row_categories].value }} ({{ d3.format(".0%")(totalColumn[row_categories][attributeType]) }})</p>
                </td>
            </tr>
            <!-- Total Row -->
            <tr>
                <th>{{module.tt('table_total')}}</th>
                <td class="row-total" v-for="(category, index) in column_categories" :key="index">
                    <p v-if="percents_or_totals == 'totals'">{{ totalRow[category].value }}</p>
                    <p v-else-if="percents_or_totals == 'percents'">{{ d3.format(".0%")(totalRow[category][attributeType]) }}</p>
                    <p v-else-if="percents_or_totals == 'both'">{{ totalRow[category].value }} ({{ d3.format(".0%")(totalRow[category][attributeType]) }})</p>
                </td>
                <!-- Grand Total -->
                <td class="grand-total">
                    <p v-if="percents_or_totals == 'totals'">{{ grandTotal }}</p>
                    <p v-else-if="percents_or_totals == 'percents'">{{ d3.format(".0%")(1) }}</p>
                    <p v-else-if="percents_or_totals == 'both'">{{ grandTotal }} ({{ d3.format(".0%")(1) }})</p>
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
            // Get the choices for the categorical first category field
            var choices_one = parseChoicesOrCalculations(this.data_dictionary[this.parameters.categorical_field_one]);

            // Get the choices for the categorical second category field
            var choices_two = parseChoicesOrCalculations(this.data_dictionary[this.parameters.categorical_field_two]);

            var this_report = this.report;

            // If the first category is a checkbox field, get a checkbox field report
            if (isCheckboxField(this.parameters.categorical_field_one)) {
                this_report = getCheckboxReport(this.parameters.categorical_field_one);
            }

            // If the second category is a checkbox field, get a checkbox field report
            if (isCheckboxField(this.parameters.categorical_field_two)) {
                this_report = getCheckboxReport(this.parameters.categorical_field_two);
            }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == this.parameters.instrument; }.bind(this));

            // If na_category_one is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (this.parameters.na_category_one == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.categorical_field_one] != ''; }.bind(this));
            }

            // If na_category_two is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (this.parameters.na_category_two == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.categorical_field_two] != ''; }.bind(this));
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[this.parameters.categorical_field_one] == ""))
                // Add an NA category to choices
                choices_one[""] = this.module.tt("na");
            
            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[this.parameters.categorical_field_two] == ""))
                // Add an NA category to choices
                choices_two[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.numeric_field] != ''; }.bind(this));
            }

            var barHeightFunction = function (d) { return d[this.parameters.numeric_field]; }.bind(this);

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'replace') {
                barHeightFunction = function (d) { return d[this.parameters.numeric_field] == '' ? this.parameters.na_numeric_value : d[this.parameters.numeric_field]; }.bind(this);
            }

            var countsNested = d3.rollup(filteredReport, v => v.length, d => d[this.parameters.categorical_field_one], d => d[this.parameters.categorical_field_two]);


            // If we are not using a numeric field, get the counts for each category
            if (!(this.parameters.is_count || this.parameters.numeric_field == '')) {
                countsNested = d3.rollup(filteredReport, v => d3[this.parameters.aggregation_function](v, barHeightFunction), d => d[this.parameters.categorical_field_one], d => d[this.parameters.categorical_field_two]);
            }

            var tableData = {};

            // Keep track of the rows and columns that must appear in the table
            var rows = new Set();
            var columns = new Set();

            // For each row in the nested counts
            for (const [row, column] of countsNested) {
                // Add the row to the rows set
                rows.add(row);

                // Add the column to the columns set
                for (const column_id of column.keys()) {
                    columns.add(column_id);
                }
            }


            if (this.parameters.unused_categories_one == 'keep') {
                columns = new Set(Object.keys(choices_two));
            }

            // If unused categories is set to keep, add all the categories to the rows and columns sets
             if (this.parameters.unused_categories_two == 'keep') {
                rows = new Set(Object.keys(choices_one));
            }

            var columnTotals = Array.from(columns).map(function (column) {
                var total = 0;
                for (const row of rows) {
                    if (countsNested.has(row) && countsNested.get(row).has(column)) {
                        total += countsNested.get(row).get(column);
                    }
                }
                return total;
            });

            var rowTotals = Array.from(rows).map(function (row) {
                var total = 0;
                for (const column of columns) {
                    if (countsNested.has(row) && countsNested.get(row).has(column)) {
                        total += countsNested.get(row).get(column);
                    }
                }
                return total;
            });

            var total = 0;
            for (const row of rows) {
                for (const column of columns) {
                    if (countsNested.has(row) && countsNested.get(row).has(column)) {
                        total += countsNested.get(row).get(column);
                    }
                }
            }

            var totalColumn = {};

            // For each row in the rows set
            for (const row of rows) {
                // For each column in the columns set
                tableData[row] = {};
                var rowTotal = 0;
                for (const column of columns) {


                    // If the row and column are not in the nested counts
                    if (countsNested.has(row) && countsNested.get(row).has(column)) {
                        tableData[row][column] = {value: countsNested.get(row).get(column), rowPercent: countsNested.get(row).get(column) / rowTotals[Array.from(rows).indexOf(row)], columnPercent: countsNested.get(row).get(column) / columnTotals[Array.from(columns).indexOf(column)], totalPercent: countsNested.get(row).get(column) / total};
                        rowTotal += countsNested.get(row).get(column);
                        continue;
                    }

                    // Add the row and column to the nested counts with a value of 0
                    tableData[row][column] = {value: 0, rowPercent: 0, columnPercent: 0, totalPercent: 0};
                }

                totalColumn[row] = {value: rowTotal, rowPercent: 1, columnPercent: rowTotal / total, totalPercent: rowTotal / total};
            }

            var totalRow = {};

            for (const column of columns) {
                var columnTotal = 0;
                for (const row of rows) {
                    if (countsNested.has(row) && countsNested.get(row).has(column)) {
                        columnTotal += countsNested.get(row).get(column);
                    }
                }
                totalRow[column] = {value: columnTotal, rowPercent: columnTotal / total, columnPercent: 1, totalPercent: columnTotal / total};
            }

            // tableData['Total']['Total'] = {value: total, rowPercent: 1, columnPercent: 1, totalPercent: 1};

            var row_column_or_table = this.parameters.row_column_or_table;
            var attributeType = 'totalPercent';
            if (row_column_or_table == 'row') {
                attributeType = 'rowPercent';
            } else if (row_column_or_table == 'column') {
                attributeType = 'columnPercent';
            }

            return {
                tableData: tableData,
                row_categories: Array.from(rows, value => value),
                column_categories: Array.from(columns, value => value),
                category_one: this.data_dictionary[this.parameters.categorical_field_one].field_label,
                category_two: this.data_dictionary[this.parameters.categorical_field_two].field_label,
                percents_or_totals: this.parameters.percents_or_totals,
                d3: d3,
                attributeType: attributeType,
                totalRow: totalRow,
                totalColumn: totalColumn,
                grandTotal: total,
                choices_one: choices_one,
                choices_two: choices_two,
            }
        },
    }
</script>

<style scoped>
    /* Make the table scrollable */
    .table-container {
        overflow-x: auto;
    }

    /* Make the row and column totals red */
    .row-total {
        color: red;
    }

    .column-total {
        color: red;
    }

    .grand-total {
        color: red;
        font-weight: bold;
    }

    /* Add space between the first and second column */
    .AG-cross-tab td:nth-child(2) {
        padding-left: 20px;
    }

    /* Center the header */
    /* Add a border around the headers */
    .header {
        text-align: center;
        border: 1px solid black;
    }

    /* Add spacing between all the cells */
    .AG-cross-tab td {
        padding: 5px;
    }

    /* Add a border around the first column */
    .AG-cross-tab td:first-child {
        border-left: 1px solid black;
        border-right: 1px solid black;
    }

    /* Add a border around the second row */
    .AG-cross-tab tr:nth-child(2) td {
        border-top: 1px solid black;
        border-bottom: 1px solid black;
    }

    /* Add a border around the total column cell */
    .AG-cross-tab tr:nth-child(2) th {
        border: 1px solid black;
    }


    /* Add a border around the final column */
    .AG-cross-tab td:last-child {
        border-right: 1px solid black;
        border-left: 1px solid black;
    }

    /* Add a border around the final row */
    .AG-cross-tab tr:last-child td {
        border-bottom: 1px solid black;
        border-top: 1px solid black;
    }

    /* Add a border around the total row cell */
    .AG-cross-tab tr:last-child th {
        border: 1px solid black;
    }



</style>