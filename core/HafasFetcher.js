"use strict";

module.exports = class HafasFetcher {
  constructor(config) {
    this.stationID = config.stationID;
    this.stationName = "";
  }


  getStationID() {
    return this.stationID;
  }


  getStationName() {
    return this.stationName;
  }
};
