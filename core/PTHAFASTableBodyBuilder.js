"use strict";

class PTHAFASTableBodyBuilder {
  constructor(config) {
    this.config = config;
  }


  getDeparturesTableBody(departures, noDepartureMessage) {
    let tBody = document.createElement("tbody");
    tBody.className = "light";

    if (departures.length === 0) {
      let row = this.getDeparturesTableNoDeparturesRow(noDepartureMessage);
      tBody.appendChild(row);

      return tBody;
    }

    let reachableCount = departures.length;
    let unreachableCount = departures.filter(departure => !departure.isReachable).length;

    departures.forEach((departure, index) => {
      let row = this.getDeparturesTableRow(departure, index, reachableCount, unreachableCount);
      tBody.appendChild(row);

      let nextDeparture = departures[index + 1];
      this.insertRulerIfNecessary(tBody, departure, nextDeparture, noDepartureMessage);
    });

    return tBody;
  }


  insertRulerIfNecessary(tBody, departure, nextDeparture, noDepartureMessage) {
    if (nextDeparture && !departure.isReachable && nextDeparture.isReachable) {
      tBody.appendChild(this.getRulerRow());
    }

    if (!departure.isReachable && !nextDeparture) {
      tBody.appendChild(this.getRulerRow());
      tBody.appendChild(this.getDeparturesTableNoDeparturesRow(noDepartureMessage));
    }
  }


  getTableCell(content, cssClass = "") {
    let cell = document.createElement("td");
    cell.className = cssClass;

    if (typeof content === "string") {
      cell.innerHTML = content;
    } else {
      cell.appendChild(content);
    }

    return cell;
  }


  getDeparturesTableNoDeparturesRow(noDepartureMessage) {
    let row = document.createElement("tr");
    row.className = "dimmed";

    let cell = document.createElement("td");
    cell.colSpan = 3;
    cell.innerHTML = noDepartureMessage;

    row.appendChild(cell);

    return row;
  }


  getDeparturesTableRow(departure, index, departuresCount, unreachableCount) {
    let row = document.createElement("tr");
    row.className = "bright";

    if (departure.isReachable) {
      row.style.opacity = this.getRowOpacity(index - unreachableCount, departuresCount);
    } else {
      row.style.opacity = this.getUnreachableRowOpacity(index, unreachableCount);
    }

    this.config.tableHeaderOrder.forEach((key) => {
      let cell = this.getCell(key, departure);
      row.appendChild(cell);
    });

    return row;
  }


  getCell(key, departure) {
    let cell;

    switch (key) {
      case "time":
        let time = departure.when;
        let delay = departure.delay;
        cell = this.getTimeCell(time, delay);
        break;

      case "line":
        let line = departure.line.name;
        cell = this.getLineCell(line);
        break;

      case "direction":
        let direction = departure.direction;
        cell = this.getDirectionCell(direction);
        break;
    }

    return cell;
  }


  getTimeCell(departure, delay) {
    let time = this.getDisplayDepartureTime(departure, delay);

    let cell = document.createElement("td");
    cell.className = "pthTimeCell";
    cell.appendChild(document.createTextNode(time));

    if (this.config.showAbsoluteTime) {
      cell.appendChild(this.getDelaySpan(delay));
    }

    return cell;
  }


  getDelaySpan(delay) {
    let delaySpan = document.createElement("span");
    delaySpan.innerHTML = this.getDelay(delay);

    let cssClass = "dimmed";

    if (this.config.useColorForRealtimeInfo) {
      cssClass = delay > 0 ? "pthHasDelay" : "pthIsTooEarly";
    }

    delaySpan.className = "pthDelay " + cssClass;

    return delaySpan;
  }


  getDelay(delay) {
    let sign = delay < 0 ? "-" : "+";

    return "&nbsp;" + sign + delay / 60 + "&nbsp;";
  }


  getDisplayDepartureTime(when, delay) {
    if (this.config.showAbsoluteTime) {
      let time = moment(when).subtract(delay, "seconds");
      return time.format("LT");

    } else {
      let time = moment(when);
      return time.fromNow();
    }
  }


  getLineCell(lineName) {
    let line;

    if (this.config.showOnlyLineNumbers && lineName.indexOf(" ") !== -1) {
      line = lineName.split(" ")[1];
    } else {
      line = lineName;
    }

    let lineDiv = document.createElement("div");
    lineDiv.innerHTML = line;
    lineDiv.className = this.getLineCssClass(lineName) + " pthTextCenter";

    return this.getTableCell(lineDiv);
  }


  getLineCssClass(lineName) {
    if (this.config.showColoredLineSymbols) {
      return this.getColoredCssClass(lineName);
    } else {
      return "pthSign pthBWLineSign";
    }
  }


  getColoredCssClass(lineName) {
    let className = "pthSign ";
    let prefix = lineName.split(" ")[0];
    let dbProducts = ["RE", "RB", "IC", "ICE"];

    if (dbProducts.includes(prefix)) {
      className += prefix.toLowerCase() + " pthDbStandard";

      if (this.config.showOnlyLineNumbers) {
        className += " " + prefix.toLowerCase() + "WithProductName";
      }
    } else {
      className += lineName.replace(/\s/g, "").toLowerCase();
    }

    return className;
  }


  getDirectionCell(direction) {
    let truncatePosition = 26;
    let content = this.getProcessedDirection(direction);
    let className = "pthDirectionCell";

    if (this.config.marqueeLongDirections && content.length > truncatePosition) {
      content = document.createElement("span");
      content.innerHTML = this.getProcessedDirection(direction);
      className += " pthMarquee";
    }

    if (!this.config.showAbsoluteTime) {
      className += " pthTextLeft";
    }

    return this.getTableCell(content, className);
  }


  getProcessedDirection(direction) {
    let replacements = this.config.replaceInDirections;
    let processed = direction;

    Object.keys(replacements).forEach((key) => {
      processed = processed.replace(new RegExp(key, "g"), replacements[key]);
    });

    return processed;
  }


  getRowOpacity(index, departuresCount) {
    if (!this.config.fadeReachableDepartures) {
      return 1.0;
    }

    let threshold = departuresCount * this.config.fadePointForReachableDepartures;
    let opacity = 1;
    let startOpacity = 0.8;
    let endOpacity = 0.2;
    let opacityDiff = (startOpacity - endOpacity) / (departuresCount - threshold);

    if (index > threshold) {
      let fadingIndex = index - threshold;
      let currentOpacity = fadingIndex * opacityDiff;
      opacity = startOpacity - currentOpacity;
    }

    return opacity;
  }


  getUnreachableRowOpacity(index, count) {
    if (!this.config.fadeUnreachableDepartures) {
      return 1.0;
    }

    let startOpacity = 0.3;
    let endOpacity = 0.6;
    let opacityDiff = (endOpacity - startOpacity) / count;

    if (index + 1 === count) {
      return endOpacity;
    } else {
      return startOpacity + opacityDiff * index;
    }
  }


  getRulerRow() {
    let row = document.createElement("tr");
    let cell = document.createElement("td");

    cell.colSpan = 3;
    cell.className = "pthRulerCell";
    row.appendChild(cell);

    return row;
  }
}