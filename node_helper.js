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

    if (typeof this.departuresFetchers[config.identifier] === "undefined") {
      fetcher = new HafasFetcher(config);
      this.departuresFetchers[config.identifier] = fetcher;
      console.log("Transportation fetcher for station with id '" + fetcher.getStationID() + "' created.");

      this.sendFetcherLoaded(fetcher);

    } else {
      fetcher = this.departuresFetchers[config.identifier];
      console.log("Using existing transportation fetcher for station id '" + fetcher.getStationID() + "'.");

      this.sendFetcherLoaded(fetcher);
    }
  },


  sendFetcherLoaded: function (fetcher) {
    this.sendSocketNotification("FETCHER_INITIALIZED", {
      identifier: fetcher.getIdentifier()
    });
  },


  fetchDepartures(identifier) {
    let fetcher = this.departuresFetchers[identifier];

    fetcher.fetchDepartures().then((fetchedDepartures) => {
      let payload = {
        identifier: fetcher.getIdentifier(),
        departures: fetchedDepartures
      };

      this.sendSocketNotification("DEPARTURES_FETCHED", payload);
    }).catch((error) => {
      let payload = {
        identifier: fetcher.getIdentifier(),
        error: error
      };

      this.sendSocketNotification("FETCH_ERROR", payload);
    });
  }
});
