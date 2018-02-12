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

    let tableBodyBuilder = new TableBodyBuilder(this.config);
    let tableBody = tableBodyBuilder.getDeparturesTableBody(departures, noDepartureMessage);
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


  getHeaderCell(textContent, symbol, cssClass = "") {
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
}