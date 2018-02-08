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
    direction: "",                      // Show only departures heading to this station. (A station ID.)
    ignoredLines: [],                   // Which lines should be ignored? (comma-separated list of line names)
    excludedTransportationTypes: [],    // Which transportation types should not be shown on the mirror? (comma-separated list of types) possible values: StN for tram, BuN for bus, s for suburban
    timeToStation: 10,                  // How long do you need to walk to the next Station?
    timeInFuture: 10,                   // Show departures for the next *timeInFuture* minutes.

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
    fadePointForReachableDepartures: 0.25,
    customLineStyles: "Leipzig",        // Prefix for the name of the custom css file. ex: Leipzig-lines.css (case sensitive)
    showOnlyLineNumbers: false          // Display only the line number instead of the complete name, i. e. "11" instead of "STR 11"
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
      timeInFuture: this.config.timeInFuture,
      direction: this.config.direction,
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

    let headings = {
      time: this.translate("PTH_DEPARTURE_TIME"),
      delay: "&nbsp;",
      line: this.translate("PTH_LINE"),
      direction: this.translate("PTH_TO")
    };

    Log.info(headings);

    let noDeparturesMessage = this.translate("PTH_NO_DEPARTURES");

    return domBuilder.getDom(this.departures, headings, noDeparturesMessage);
  },


  getStyles: function () {
    let styles = [
      this.file("css/styles.css"),
      "font-awesome.css"
    ];

    if (this.config.customLineStyles !== "") {
      let customStyle = "css/" + this.config.customLineStyles + "-lines.css";
      styles.push(this.file(customStyle));
    }

    return styles;
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
    Log.info(this.config.name + " (main module) received notification: " + notification);

    if (!this.isForThisStation(payload)) {
      return;
    }

    switch (notification) {
      case "FETCHER_INITIALIZED":
        this.stationName = payload.stationName;
        this.initialized = true;
        this.startFetchingLoop(this.config.updatesEvery);

        break;

      case "DEPARTURES_FETCHED":
        // reset error object
        this.error = {};
        this.departures = payload.departures;
        this.updateDom(2000);

        // TODO: Remove!
        Log.info(this.departures);
        break;

      case "FETCH_ERROR":
        this.error = payload.error;
        this.departures = [];
        this.updateDom(2000);

        break;
    }
  },


  isForThisStation: function (payload) {
    return payload.stationID === this.config.stationID;
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
    // start immediately ...
    this.sendSocketNotification("FETCH_DEPARTURES", this.config.stationID);

    // ... and then repeat in the given interval
    setInterval(() => {
      this.sendSocketNotification("FETCH_DEPARTURES", this.config.stationID);
    }, interval * 1000);
  },


  hasErrors: function () {
    return (Object.keys(this.error).length > 0);
  },
});

