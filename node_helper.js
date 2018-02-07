"use strict";

const NodeHelper = require("node_helper");
const HafasFetcher = require("./core/HafasFetcher");


module.exports = NodeHelper.create({

  start: function () {
    this.departuresFetchers = [];
  },


  socketNotificationReceived: function(notification, payload) {
    console.log("node helper received notification: " + notification);

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
      this.departuresFetchers[config.stationID] = fetcher;
      console.log("Transportation fetcher for station '" + fetcher.getStationName() + "' created. (Station ID: " + fetcher.getStationID() + ")");

      this.sendFetcherLoaded(fetcher);

    } else {
      fetcher = this.departuresFetchers[config.stationID];
      console.log("Using existing transportation fetcher for station '" + fetcher.getStationName() + "' (Station ID: " + fetcher.getStationID() + ")");

      this.sendFetcherLoaded(fetcher);
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
