# Introduction

This document is intended to outline the steps in developing 

1. Building a Vue app
2. Compiling it as a library
3. Creating entry points from PHP into the app and importing the data
4. Creating components
5. The development process

# 1. Building a Vue App

## 1.1 Installing Node.js and npm

To install Vue you must first have Node.js and npm, or some other package manager installed on your machine. To do this with npm, go to the Node.js website and download the applicable installer.

## 1.2 Installing Vue CLI

Once npm is installed installing the Vue CLI is trivial. Simply run:

```sh
npm install -g @vue/cli
```

This will install the vue cli and vue ui which can be used to create new projects.

##  1.3 Using Vue UI to create a new project

Run Vue UI:

```sh
vue ui
```

This will open a webserver on the localhost of your machine that will run the Vue User interface. From there you can navigate to the project manager. Click on the create tab and navigate to the directory where you want to create a new project. Click create new project here and the Vue cli will do all the work required to create a new blank Vue project.

# 2. Compiling it as a library

## 2.1 Adding a build script

When the new app is created, a new package.json will be created for npm. For the purposes of our app, since we need to compile it as a library to be able to access it within PHP, we will add a build-lib script to the scripts object in `package.json`.

```json
  "scripts": {

    "serve": "vue-cli-service serve",

    "build": "vue-cli-service build",

    "lint": "vue-cli-service lint",

    "build-lib": "vue-cli-service build --target lib --inline-vue --name AdvancedGraphs src/main.js"

  },
```
- **--target lib** specifies that we are building the vue app as a library

- **--inline-vue** tells vue to include the Vue module in the library and that the app will not call vue from a CDN or elsewhere.

- **--name AdvancedGraphs** The name of the files that are created will be AdvancedGraphs.js, AdvancedGraphs.css, etc…

- **src/main.js** specifies the name of the file that will be used as an entry point for the app.

## 2.2 Creating an entry point

Your entry point should expose the functions that your plugin will call to run the app. The following is an example of the DashBoardEditor app that my library will export:

```js
// main.js

import { createApp } from'vue';

importDashboardEditorfrom'./DashboardEditor.vue';

importDashboardListfrom'./DashboardList.vue';

importDashboardViewerfrom'./DashboardViewer.vue';

import'bootstrap/dist/css/bootstrap.min.css';

import { FontAwesomeIcon } from'@fortawesome/vue-fontawesome';

exportfunctioncreateDashboardEditorApp (module, dashboard, report, data_dictionary, report_fields_by_repeat_instrument) {

    constapp = createApp(DashboardEditor, {

        module:module,

        dashboard:dashboard,

        report:report,

        data_dictionary:data_dictionary,

        report_fields_by_repeat_instrument:report_fields_by_repeat_instrument,

    });

    app.component('font-awesome-icon', FontAwesomeIcon);

    returnapp;

}
```

First the necessary elements are imported from their locations in the file structure. Vue will also import any imports that these components import when the app is built.

Next a function which takes the necessary data and passes it to the DashBoardEditor Component is created. We will get into each of the parameters for this function we discuss importing data.

## 2.3 Building the app

The app can now be built by running:

npm runbuild-lib

# 3. Creating entry points from PHP.

## 3.1 JavaScript Loading Function

To load JavaScript from PHP, a function was created that echoes the script tag into the html file that gets accessed by the user inside the module class for your external module. In this case our module file is AdvancedGraphsInteractive.php This function looks like the following:

```php
functionloadJS($js_file, $folder = "js", $outputToPage=true) {

    // Create script tag

    $output = "<script type="text/javascript" src="" . $this->getURL($js_file,  $this->module_js_path). ""></script>n";

    if ($outputToPage) {

        print$output;

    } else {

        return$output;

    }

}
```
The way REDCap modules work is that a new object called module gets created before the PHP file for the page you are rendering gets run. So, to call module functions you can call:
```php
$module->function_name($parameters);
```
So to call the library you built for your app, you can call:
```php
$module->loadJS('advanced-graph-vue/dist/AdvancedGraphs.umd.js');
```
A similar process is used for calling the CSS needed for the app.

## 3.2 Calling the app within PHP

### 3.2.1 Immediately Invoked Function Expression (IIFE)
```js
(function() {

})();
```
To avoid polluting the global namespace. Our function is called within an immediately invoked function expression like above.

### 3.2.2 Getting the data into JavaScript.

To get the data into JavaScript, the data is encoded as json and then echoed to into the html file that PHP renders.
```php
<script>

(function() {
var module = <?=$module->getJavascriptModuleObjectName()?>;

var dashboard = <?php echo json_encode($dashboard); ?>;

var data_dictionary = <?php echo json_encode($data_dictionary); ?>;

var report = <?php echo json_encode($report); ?>;

var report_fields_by_reapeat_instrument = <?php echo json_encode($report_fields_by_reapeat_instrument); ?>;
})();

</script>
```
- **module:** This is the JavaScript module used to access the language keys in English.ini, along with other useful functions that are made available to developers by the REDCap team.
- **dashboard:** This is the data required for this Advanced Graphs dashboard. It includes the rows and columns, the cells of which hold the graph type and the parameters needed to generate that graph.
- **data_dictionary:** This is the data dictionary for the project. The app uses it to get field labels, option labels, and figure out what type of field a particular variable is (categorical, numeric, date, etc…)
- **report:** This is the data that is available in the REDCap report associated with the dashboard.
- **report_fields_by_repeat_instrument:** This splits the instruments based on which variables can be used in conjunction to create a graph. Unfortunately, we cannot create graphs from variables that are in separate repeatable instruments.

## 3.3 Calling the app

### 3.3.1 Creating an empty div that will hold the app

```html
<div id="advanced_graphs">

</div>
```
Before the script tag that mounts the app, we need an empty div that will hold it,

### 3.3.2 Mounting the app to the div
```js
var app = AdvancedGraphs.createDashboardEditorApp(module, dashboard, report,

data_dictionary, report_fields_by_reapeat_instrument);

app.mount('#advanced_graphs');
```
Since our library is stored in the variable called AdvancedGraphs, we can access the functions we exported earlier using AdvancedGraphs.functionName. In this case we pass all of the data to our function which creates the dashboard editor and then we mount the app to our advanced_graphs div.

# 4. Creating Vue Components

To demonstrate how Vue components are built I will show the smallest created component by line count and explain various aspects of the

## 4.1 Basic Boilerplate
```html
<template></template>

<script></script>

<style></style>
```
The basic boilerplate for a Vue app is shown above. You have your html template. The script tag which defines the object Vue uses to create the interactivity of the component. And a style script which defines the CSS for this component.

## 4.2 Instrument Selector

The Instrument Selector is the component which takes the fewest lines of code and makes for a good starting example on how to create a component.

### 4.2.1 The template
```html
<template>

  <div>

    <label for="instrument">{{module.tt('select_an_instrument')}}:</label>

      <br>

      <select name="instrument" v-model="selectedInstrument" @change="onInstrumentChange">

        <option :selected="true" :value="null">--{{module.tt('select_an_instrument')}} --</option>

        <option v-for="(instrument, instrument_name) inavailableInstruments" :key="instrument_name" :value="instrument_name" :selected="selectedInstrument===instrument_name">

          {{ instrument.label }}

        </option>

      </select>

  </div>

</template>
```
#### 4.2.1.1 Elements in {{ }}

Within a script tag, you can access variables from JavaScript. In this case we access module.tt which is the method we use for getting the values from our language keys. The reason we use language keys is so the module can easily be translated to another language.

#### 4.2.1.2 v-model

v-model creates a two-way binding for a variable. This way when the selected instrument in our v-model changes the variable selectedInstrument changes.

#### 4.2.1.3 props

Props create one way bindings. In this case an example of a prob is:

:value="instrument_name"

That tells the option element that the value for this particular option is the instrument name.

#### 4.2.1.4 v-for

The v-for directive tells Vue to create an element for each instance in an iterable.

#### 4.2.1.5 event listeners

The event listeners listen for an event for their element and calls a function when that event occurs. In this case we have the

@change="onInstrumentChange"

Event listener for the selected instrument which listens for when the selected element changes and calls the onInstrumentChange method defined for the Vue component later.

### 4.2.2 The Script
```html
<script>s
  export default {
    name:"InstrumentSelector",
    inject: ["module"],
    props: {
      availableInstruments: {
        type:Object,
        default:null,
      },
      modelValue: {
        type:String,
        default:null,
      },
    },
    data() {
      return {
        selectedInstrument:this.modelValue,
      };
    },
    methods: {
      onInstrumentChange() {
        this.$emit("update:modelValue", this.selectedInstrument);
      },
    },
  };s
</script>
```
The script for a Vue component defines the Object Vue uses to create the component.

#### 4.2.2.1 name

The name for the Vue component.

#### 4.2.2.2 inject

Inject allows the component to access objects that are provided by the top-level component. In this case we are injecting the module object so we can have access to the language key pairs.

#### 4.2.2.3 props

Props defines the properties that are passed to the component from their parents. The available instruments and the currently selected instrument is provided by the InstumentSelector's parent.

modelValue is a unique property which specifies the v-model property. In this case the modelValue is the currently selected instrument.

#### 4.2.2.4 data()

This is the data that is made available to the component at the time it is first rendered.

#### 4.2.2.5 methods

These are the methods that are made available to the component. In this case onInstrumentChange updates the v-model to the currently selected instrument.

### 4.2.3 Style
```html
  <style scoped>
    label {
      font-weight: bold;
    }

    select {
      width: 100%;
      padding: 5px;
      border: 1pxsolid#ccc;
      border-radius: 5px;
      text-align-last: center;
    }
  </style>
```
This block sets the style for the component. The **scoped** keyword in the style tag specifies that these styles should only be used for this component.

# 5. The development process

## 5.1 Serving the app on the local machine

Since it is time consuming to build the app every time you want to view changes. Vue has created a serve function that hot reloads the app every time you make a change. To serve the app locally, you can run

```sh 
npm run serve
```

which in turn runs:

```sh
vue-cli-service serve
```
The app will open on your machine.

## 5.2 Creating an entry point for your app

In the `vue.config.js` add the pages you want to be able to test as follows:

```js
module.exports = defineConfig({

  filenameHashing:false,

  pages: {

    testingEditor: {

      entry:'src/test-edit-dash.js',

      template:'public/testingEditor.html',

      filename:'testingEditor.html',

      title:'Testing Editor',

    },

  },

});
```
### 5.2.1 entry

This is the file that mounts the app. Here is a snippet from test-edit-dash.js:
```js
const app = createApp(DashboardEditor, {
    module: testModule,
    dashboard: testDashboard,
    report: testReport,
    data_dictionary: testDataDictionary,
    report_fields_by_repeat_instrument: testReportFieldsByRepeatInstrument,
})

app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#advanced_graphs_test');
```
### 5.2.2 template

You need to create a template that has the div that you will mount your app to. Here is the `testingEditor.html` file:
```html
<!DOCTYPEhtml>
<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport"content="width=device-width, initial-scale=1.0">
      <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
      />
      <title>Testing Editor</title>
  </head>
  <body>
      <div id="advanced_graphs_test"></div>
  </body>
</html>
```

### 5.2.3 filename

This is the name of the file that will get created for this page.

### 5.2.3 title

This will be the title of the page.

## 5.3 Developing

Now we can develop the app and see changes as soon as they are made without having to build. When the developer is ready to update the module for use within REDCap, they can run:

```sh
npm run build-lib
```