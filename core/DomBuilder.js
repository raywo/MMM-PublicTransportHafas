"use strict";

class DomBuilder {

  constructor(config) {
    this.config = config;

    this.headingSymbols = {
      time: "fa fa-clock-o",
      line: "fa fa-bus",
      direction: "fa fa-map-marker"
    };
  }


  getSimpleDom(message) {
    let wrapper = this.getWrapper();
    wrapper.appendChild(this.getDiv(message));

    return wrapper;
  }


  getDom(departures, headings, noDeparturesMessage) {
    let wrapper = this.getWrapper();
    let departuresTable = this.getDeparturesTable(departures, headings, noDeparturesMessage);
    wrapper.appendChild(departuresTable);

    return wrapper;
  }


  getWrapper() {
    let wrapper = document.createElement("div");
    wrapper.className = "pthWrapper";
    wrapper.appendChild(this.createHeadingElement(this.config.headerPrefix, this.config.stationName, this.config.headerAppendix));

    return wrapper;
  }


  getDiv(message, cssClasses = "small light dimmed") {
    let messageDiv = document.createElement("div");
    messageDiv.className = cssClasses;
    messageDiv.innerHTML = message;

    return messageDiv;
  }


  // Create the module header. Prepend headerPrefix if given.
  createHeadingElement(headerPrefix, stationName, headerAppendix) {
    let headingElement = document.createElement("header");
    let heading = stationName;

    if (headerPrefix !== "") {
      heading = headerPrefix + " " + heading;
    }

    if (headerAppendix !== "") {
      heading += " " + headerAppendix;
    }

    headingElement.innerHTML = heading;

    return headingElement;
  }

  getDeparturesTable(departures, headings, noDepartureMessage) {
    let table = document.createElement("table");
    table.className = "pthTable small";

    if (this.config.showTableHeaders) {
      let tableHeader = this.getDeparturesTableHeader(headings);
      table.appendChild(tableHeader);
    }

    let tableBody = this.getDeparturesTableBody(departures, noDepartureMessage);
    table.appendChild(tableBody);

    return table;
  }


  getDeparturesTableHeader(headings) {
    let tHead = document.createElement("thead");
    let headerRow = document.createElement("tr");
    headerRow.className = "bold dimmed";

    headerRow.appendChild(this.getHeaderCell(headings.time, this.headingSymbols.time));
    headerRow.appendChild(this.getHeaderCell(headings.line, this.headingSymbols.line, "pthTextCenter"));
    headerRow.appendChild(this.getHeaderCell(headings.direction, this.headingSymbols.direction, "pthTextCenter"));

    tHead.appendChild(headerRow);

    return tHead;
  }


  getDeparturesTableBody(departures, noDepartureMessage) {
    let tBody = document.createElement("tbody");
    tBody.className = "light";

    if (departures.length === 0) {
      let row = this.getDeparturesTableNoDeparturesRow(noDepartureMessage);
      tBody.appendChild(row);

      return tBody;
    }

    departures.forEach((departure, index) => {
      let row = this.getDeparturesTableRow(departure, index, departures.length);
      tBody.appendChild(row);
    });

    return tBody;
  }


  getHeaderCell(textContent, symbol, cssClass) {
    let headerContent;

    if (this.config.showTableHeadersAsSymbols) {
      headerContent = document.createElement("i");
      headerContent.className = symbol;

    } else {
      headerContent = textContent;
    }

    return this.getTableCell(headerContent, cssClass);
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
    cell.colSpan = 4;
    cell.innerHTML = noDepartureMessage;

    row.appendChild(cell);

    return row;
  }

  getDeparturesTableRow(departure, index, departuresCount) {
    let time = this.getDepartureTime(departure.when, departure.delay);
    let delay = departure.delay;
    let line = departure.line.name;
    let direction = departure.direction;

    let row = document.createElement("tr");
    row.className = "bright";
    row.style.opacity = this.getRowOpacity(index, departuresCount);

    row.appendChild(this.getTimeCell(time, delay));
    row.appendChild(this.getLineCell(line));
    row.appendChild(this.getDirectionCell(direction));

    return row;
  }

  getTimeCell(time, delay) {
    let cell = document.createElement("td");
    cell.appendChild(document.createTextNode(time));
    cell.appendChild(this.getDelaySpan(delay));

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


  getDepartureTime(when, delay) {
    let time = moment(when).subtract(delay, "seconds");

    return time.format("LT");
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
}