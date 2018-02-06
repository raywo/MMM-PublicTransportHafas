"use strict";

Module.register("MMM-PublicTransportLeipzig", {

  // default values
  defaults: {
    name: "MMM-PublicTransportLeipzig",
    hidden: false,
    headerPrefix: "",
    stationName: "Wilhelm-Leuschner-Platz",
    stationId: "12992",
    directions: [],                     // Which directions (final destinations) should be included? (You need to list all possible final destinations to see all possible departures. For instance for Str 1 you need to list "Schönefeld" and "Mockau" to see Str 1 and Str 1E.)
    ignoredLines: [],                   // Which lines should be ignored? (comma-separated list of line names)
    excludedTransportationTypes: [],    // Which transportation types should not be shown on the mirror? (comma-separated list of types) possible values: StN for tram, BuN for bus, s for suburban
    marqueeLongDirections: true,        // Use Marquee effect for long station names?
    timeToStation: 10,                  // How long do you need to walk to the next Station?
    interval: 120,                      // How often should the table be updated in s?
    showColoredLineSymbols: true,       // Want colored line symbols?
    useColorForRealtimeInfo: true,      // Want colored real time information (timeToStation, early)?
    showTableHeaders: true,             // Show table headers?
    showTableHeadersAsSymbols: true,    // Table Headers as symbols or written?
    maxUnreachableDepartures: 3,        // How many unreachable departures should be shown?
    maxReachableDepartures: 7,          // How many reachable departures should be shown?
    fadeUnreachableDepartures: true,
    fadeReachableDepartures: true,
    fadePointForReachableDepartures: 0.25
  },


  start: function () {

  },


  getDom: function () {

  },

  getStyles: function () {
    return [
      'style.css',
      'font-awesome.css'
    ];
  },

  getScripts: function () {
    return [
      "moment.js",
      //this.file("DomCreator.js")
    ];
  },


  getTranslations: function() {
    return {
      en: "translations/en.json",
      de: "translations/de.json"
    };
  },


  socketNotificationReceived: function (notification, payload) {
    if (notification === 'FETCHER_INIT') {
      if (this.isThisStation(payload)) {
        this.stationName = payload.stationName;
        this.loaded = true;
      }
    }

    if (notification === 'DEPARTURES') {
      this.config.loaded = true;

      if (this.isThisStation(payload)) {
        // Empty error object
        this.error = {};
        // Proceed with normal operation
        this.departuresArray = payload.departuresArray;
        this.updateDom(3000);
      }
    }

    if (notification === 'FETCH_ERROR') {
      this.config.loaded = true;

      if (this.isThisStation(payload)) {
        // Empty error object
        this.error = payload;
        this.updateDom(3000);
      }
    }
  }
});

