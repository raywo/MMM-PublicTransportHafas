"use strict";

Module.register("MMM-PublicTransportHafas", {

  // default values
  defaults: {
    // Module misc
    name: "MMM-PublicTransportHafas",
    hidden: false,
    updatesEvery: 120,                  // How often should the table be updated in s?

    // Header
    headerPrefix: "",
    headerAppendix: "",
    stationName: "Wilhelm-Leuschner-Platz",
    //stationID: "008012202",

    // Departures options
    directions: [],                     // Which directions should be included? (List of station IDs.)
    ignoredLines: [],                   // Which lines should be ignored? (comma-separated list of line names)
    excludedTransportationTypes: [],    // Which transportation types should not be shown on the mirror? (comma-separated list of types) possible values: StN for tram, BuN for bus, s for suburban
    timeToStation: 10,                  // How long do you need to walk to the next Station?

    // Look and Feel
    marqueeLongDirections: true,        // Use Marquee effect for long station names?
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
    Log.info("Starting module: " + this.name);

    this.departures = [];
    this.stationName = "";
    this.initialized = false;
    this.error = {};

    this.sanitzeConfig();


    if (!this.config.stationID) {
      Log.error("stationID not set! " + this.config.stationID);
      this.error.message = this.translate("NO_STATION_ID_SET");

      return;
    }

    let fetcherOptions = {
      stationID: this.config.stationID,
      timeToStation: this.config.timeToStation,
      directions: this.config.directions,
      ignoredLines: this.config.ignoredLines,
      excludedTransportationTypes: this.config.excludedTransportationTypes
    };

    this.sendSocketNotification("CREATE_FETCHER", fetcherOptions);
  },


  getDom: function () {
    let domBuilder = new DomBuilder(this.config);

    if (this.hasErrors()) {
      return domBuilder.getSimpleDom(this.error.message);
    }

    if (!this.initialized) {
      return domBuilder.getSimpleDom(this.translate("LOADING"));
    }

    return domBuilder.getDom();
  },


  getStyles: function () {
    return [
      this.file("css/styles.css"),
      "font-awesome.css"
    ];
  },


  getScripts: function () {
    return [
      "moment.js",
      this.file("core/DomBuilder.js")
    ];
  },


  getTranslations: function() {
    return {
      en: "translations/en.json",
      de: "translations/de.json"
    };
  },


  socketNotificationReceived: function (notification, payload) {
    if (this.isThisStation(payload)) {
      if (notification === 'FETCHER_INITIALIZED') {
        this.stationName = payload.stationName;
        this.initialized = true;
        this.startFetchingLoop(this.config.updatesEvery);
      }
    }

    // if (notification === 'DEPARTURES') {
    //   this.config.initialized = true;
    //
    //   if (this.isThisStation(payload)) {
    //     // Empty error object
    //     this.error = {};
    //     // Proceed with normal operation
    //     this.departuresArray = payload.departuresArray;
    //     this.updateDom(3000);
    //   }
    // }
    //
    // if (notification === 'FETCH_ERROR') {
    //   this.config.initialized = true;
    //
    //   if (this.isThisStation(payload)) {
    //     // Empty error object
    //     this.error = payload;
    //     this.updateDom(3000);
    //   }
    // }
  },


  isThisStation: function (station) {
    return station.stationID === this.config.stationID;
  },


  sanitzeConfig: function () {
    if (this.config.updatesEvery < 30) {
      this.config.updatesEvery = 30;
    }

    if (this.config.timeToStation < 0) {
      this.config.timeToStation = 0;
    }

    if (this.config.maxUnreachableDepartures < 0) {
      this.config.maxUnreachableDepartures = 0;
    }

    if (this.config.maxReachableDepartures < 0) {
      this.config.maxReachableDepartures = this.defaults.maxReachableDepartures;
    }
  },


  startFetchingLoop: function(interval) {
    setInterval(() => {
      this.sendSocketNotification("FETCH_DEPARTURES", this.config.stationID);
    }, interval * 1000);
  },


  hasErrors: function () {
    return (Object.keys(this.error).length > 0);
  },
});

