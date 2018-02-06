"use strict";

const NodeHelper = require("node_helper");
const HafasFetcher = require("./core/HafasFetcher");


module.exports = NodeHelper.create({

  start: function () {
    this.departuresFetchers = [];
  },


  socketNotificationReceived: function(notification, payload) {
    if (notification === "CREATE_FETCHER") {
      this.createFetcher(payload);
    }

    if (notification === "FETCH_DEPARTURES") {
      this.fetchDepartures(payload);
    }
  },


  createFetcher: function (config) {
    let fetcher;

    if (typeof this.departuresFetchers[config.stationID] === "undefined") {
      fetcher = new HafasFetcher(config);
      this.departuresFetchers[config.stationID] = fetcher;
      this.sendFetcherLoaded(fetcher);

      console.log("Transportation fetcher for station '" + fetcher.getStationName() + "' created. (Station ID: " + fetcher.getStationID() + ")");

    } else {
      fetcher = this.departuresFetchers[config.stationID];
      this.sendFetcherLoaded(fetcher);

      console.log("Using existing transportation fetcher for station '" + fetcher.getStationName() + "' (Station ID: " + fetcher.getStationID() + ")");
    }
  },


  sendFetcherLoaded: function (fetcher) {
    this.sendSocketNotification("FETCHER_INITIALIZED", {
      stationID: fetcher.getStationID(),
      stationName: fetcher.getStationName()
    });
  },


  fetchDepartures(stationID) {
    let fetcher = this.departuresFetchers[stationID];

    // TODO: Implement .then and sendNotification()
    fetcher.fetchDepartures();
  }
});
