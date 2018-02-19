"use strict";

class TableBodyBuilder {
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

      if (!departure.isReachable && nextDeparture.isReachable) {
        tBody.appendChild(this.getRulerRow());
      }
    });

    return tBody;
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
    let time = departure.when;
    let delay = departure.delay;
    let line = departure.line.name;
    let direction = departure.direction;

    let row = document.createElement("tr");
    row.className = "bright";

    if (departure.isReachable) {
      row.style.opacity = this.getRowOpacity(index - unreachableCount, departuresCount);
    } else {
      row.style.opacity = this.getUnreachableRowOpacity(index, unreachableCount);
    }

    row.appendChild(this.getTimeCell(time, delay));
    row.appendChild(this.getLineCell(line));
    row.appendChild(this.getDirectionCell(direction));

    return row;
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
      let className = "pthSign ";
      let prefix = lineName.split(" ")[0];
      let dbProducts = [ "RE", "RB", "IC", "ICE" ];

      if (dbProducts.includes(prefix)) {
        className += prefix.toLowerCase() + " pthDbStandard";
      } else {
        className += lineName.replace(/\s/g, '').toLowerCase();
      }

      return className;

    } else {
      return "pthSign pthBWLineSign";
    }
  }


  getDirectionCell(direction) {
    let truncatePosition = 26;
    let content = direction;
    let className = "pthDirectionCell";

    if (this.config.marqueeLongDirections && content.length > truncatePosition) {
      content = document.createElement("span");
      content.innerHTML = direction;
      className += " pthMarquee";
    }

    return this.getTableCell(content, className);
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