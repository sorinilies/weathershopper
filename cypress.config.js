const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl:"https://weathershopper.pythonanywhere.com/",
    chromeWebSecurity: false,
    blockHosts: ["google-analytics.com", "googletagmanager.com", "ampcid.google.com"],
    defaultCommandTimeout: 8000,
    responseTimeout: 12000
  }
});
