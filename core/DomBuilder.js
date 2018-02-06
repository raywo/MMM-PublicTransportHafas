"use strict";

class DomBuilder {

  constructor(config) {
    this.config = config;
  }


  getSimpleDom(message) {
    let wrapper = this.getWrapper();
    wrapper.appendChild(this.createHeadingElement(this.config.headerPrefix, this.config.stationName, this.config.headerAppendix));
    wrapper.appendChild(this.getDiv(message));

    return wrapper;
  }


  getDom() {
    // TODO: Replace stub with real code.
    let wrapper = this.getWrapper();
    wrapper.appendChild(this.createHeadingElement(this.config.headerPrefix, this.config.stationName, this.config.headerAppendix));
    wrapper.appendChild(this.getDiv("So wird es dann aussehen."));

    return wrapper;
  }


  getWrapper() {
    let wrapper = document.createElement("div");
    wrapper.className = "pthWrapper";

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
}