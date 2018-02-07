"use strict";

const moment = require("moment");
const createClient = require('hafas-client')
const profile = require('hafas-client/p/db')

module.exports = class HafasFetcher {

  /**
   *
   * @param config The configuration used for this fetcher. It has the following format:
   *        config = {
   *          stationID: *a valid station id*,
   *          timeToStation: *an integer describing how long it takes to get to the station (in minutes)*,
   *          direction: *an array of station ids*,
   *          ignoredLines: *an array of line names which are to be ignored*,
   *          excludedTransportationTypes: *an array of product names which are not to be shown*
   *        }
   */
  constructor(config) {
    this.config = config;
    this.hafasClient = createClient(profile);
  }


  getStationID() {
    return this.config.stationID;
  }


  getStationName() {
    return this.config.stationName;
  }


  fetchDepartures() {
    let options = {
      when: this.getDepartureTime(),
      direction: this.config.direction
    };

    return this.hafasClient.departures(this.config.stationID, options);
  }


  getDepartureTime() {
    // TODO: Maybe a few minutes earlier to be able to show unreachable departures.
    return moment().add(this.config.timeToStation, "minutes");
  }
};
