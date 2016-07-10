var app = angular.module("myApp", ['schemaForm', 'jsonFormatter']);
app.config(function (JSONFormatterConfigProvider) {
    // Enable the hover preview feature
    JSONFormatterConfigProvider.hoverPreviewEnabled = true;
});