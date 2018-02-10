"use strict";

const NodeHelper = require("node_helper");
const HafasFetcher = require("./core/HafasFetcher");


module.exports = NodeHelper.create({

  start: function () {
    this.departuresFetchers = [];
  },


  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "CREATE_FETCHER":
        this.createFetcher(payload);
        break;

      case "FETCH_DEPARTURES":
        this.fetchDepartures(payload);
        break;
    }
  },


  createFetcher: function (config) {
    let fetcher;

    if (typeof this.departuresFetchers[config.stationID] === "undefined") {
      fetcher = new HafasFetcher(config);
      // TODO: Use something else as index to make two module instances with the same stationID possible.
      this.departuresFetchers[config.stationID] = fetcher;
      console.log("Transportation fetcher for station with id '" + fetcher.getStationID() + "' created.");

      this.sendFetcherLoaded(fetcher);

    } else {
      fetcher = this.departuresFetchers[config.stationID];
      console.log("Using existing transportation fetcher for station id '" + fetcher.getStationID() + "'.");

      this.sendFetcherLoaded(fetcher);
    }
  },


  sendFetcherLoaded: function (fetcher) {
    this.sendSocketNotification("FETCHER_INITIALIZED", {
      // TODO: Use something else as index to make two module instances with the same stationID possible.
      stationID: fetcher.getStationID()
    });
  },


  fetchDepartures(stationID) {
    let fetcher = this.departuresFetchers[stationID];

    fetcher.fetchDepartures().then((fetchedDepartures) => {
      let payload = {
        stationID: fetcher.getStationID(),
        departures: fetchedDepartures
      };

      this.sendSocketNotification("DEPARTURES_FETCHED", payload);
    }).catch((error) => {
      let payload = {
        stationID: fetcher.getStationID(),
        error: error
      };

      this.sendSocketNotification("FETCH_ERROR", payload);
    });
  }
});
