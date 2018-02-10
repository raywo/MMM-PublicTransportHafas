"use strict";

const moment = require("moment");
const createClient = require("hafas-client");
const profile = require("hafas-client/p/db");
const arrayDiff = require("arr-diff");


module.exports = class HafasFetcher {

  /**
   *
   * @param config The configuration used for this fetcher. It has the following format:
   *        config = {
   *          stationID: *a valid station id*,
   *          timeToStation: *an integer describing how long it takes to get to the station (in minutes)*,
   *          timeInFuture: *an integer describing how far in the future the departure can lie*
   *          direction: *an array of station ids*,
   *          ignoredLines: *an array of line names which are to be ignored*,
   *          excludedTransportationTypes: *an array of product names which are not to be shown*
   *        }
   */
  constructor(config) {
    this.config = config;
    this.hafasClient = createClient(profile);

    // types given by the api
    this.possibleTypes = [ "bus", "ferry", "express", "nationalExp", "regional", "suburban", "tram", "subway" ];
    this.config.includedTransportationTypes = arrayDiff(this.possibleTypes, this.config.excludedTransportationTypes);
  }


  getStationID() {
    return this.config.stationID;
  }


  fetchDepartures() {
    let options = {
      when: this.getDepartureTime(),
      direction: this.config.direction,
      duration: this.config.timeInFuture
    };

    return this.hafasClient.departures(this.config.stationID, options)
      .then((departures) => {
        return this.filterByTransportationTypes(departures);
      }).catch((e) => {
        throw e;
      });
  }


  getDepartureTime() {
    // TODO: Maybe a few minutes earlier to be able to show unreachable departures.
    return moment().add(this.config.timeToStation, "minutes");
  }


  filterByTransportationTypes(departures) {
    return departures.filter((departure) => {
      let product = departure.line.product;
      let index = this.config.includedTransportationTypes.indexOf(product);

      return index !== -1;
    });
  }
};
