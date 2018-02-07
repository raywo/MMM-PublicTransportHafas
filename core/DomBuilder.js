"use strict";

class DomBuilder {

  constructor(config) {
    this.config = config;
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

    headerRow.appendChild(this.getTableCell(headings.time));
    headerRow.appendChild(this.getTableCell(headings.delay));
    headerRow.appendChild(this.getTableCell(headings.line));
    headerRow.appendChild(this.getTableCell(headings.direction, "pthTextRight"));

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

    departures.forEach((departure) => {
      let row = this.getDeparturesTableRow(departure);
      tBody.appendChild(row);
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
    cell.colSpan = 4;
    cell.innerHTML = noDepartureMessage;

    row.appendChild(cell);

    return row;
  }

  getDeparturesTableRow(departure) {
    let time = this.getDepartureTime(departure.when, departure.delay);
    let delay = departure.delay;
    let line = departure.line.name;
    let direction = departure.direction;

    let row = document.createElement("tr");
    row.className = "bright";

    row.appendChild(this.getTableCell(time));
    row.appendChild(this.getDelayCell(delay));
    row.appendChild(this.getLineCell(line));
    row.appendChild(this.getTableCell(direction));

    return row;
  }

  getDelayCell(delay) {
    let cell = this.getTableCell(this.getDelay(delay));
    let cssClass = delay < 0 ? "pthHasDelay" : "pthIsTooEarly";
    cell.className = "pthDelayCell " + cssClass;

    return cell;
  }

  getDepartureTime(when, delay) {
    let time = moment(when).subtract(delay, "seconds");

    return time.format("LT");
  }

  getDelay(delay) {
    let sign = delay < 0 ? "-" : "+";

    return sign + delay / 60 + "&nbsp;";
  }

  getLineCell(lineName) {
    let lineDiv = document.createElement("div");
    lineDiv.innerHTML = lineName;
    lineDiv.className = this.getLineCssClass(lineName);

    return this.getTableCell(lineDiv);
  }

  getLineCssClass(lineName) {
    if (this.config.showColoredLineSymbols) {
      return "pthSign " + lineName.replace(/\s/g, '').toLowerCase();
    } else {
      return "pthSign pthBWLineSign xsmall";
    }
  }
}