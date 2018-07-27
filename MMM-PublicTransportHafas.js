 /*
  * Update by AgP42 the 18/07/2018
  * 
  * Modification added : 
  * - Management of a PIR sensor with the module MMM-PIR-Sensor (by PaViRo). In case PIR module detect no user, 
  * the update of the ToDoIst is stopped and will be requested again at the return of the user
  * - Management of the "module.hidden" by the core system : same behaviour as "User_Presence" by the PIR sensor
  * - Possibility to add the last update time from server at the end of the module. 
  * This can be configured using "displayLastUpdate" and "displayLastUpdateFormat"
  * */

"use strict";

//UserPresence Management (PIR sensor)
var UserPresence = true; //true by default, so no impact for user without a PIR sensor

Module.register("MMM-PublicTransportHafas", {

  // default values
  defaults: {
    // Module misc
    name: "MMM-PublicTransportHafas",
    hidden: false,
    updatesEvery: 120,                  // How often should the table be updated in s?

    // Header
    headerPrefix: "",
    headerAppendix: "",

 	//Display last update time
	displayLastUpdate: false, //add or not a line after the tasks with the last server update time
	displayLastUpdateFormat: 'dd - HH:mm:ss', //format to display the last update. See Moment.js documentation for all display possibilities
    
    // Departures options
    direction: "",                      // Show only departures heading to this station. (A station ID.)
    ignoredLines: [],                   // Which lines should be ignored? (comma-separated list of line names)
    excludedTransportationTypes: [],    // Which transportation types should not be shown on the mirror? (comma-separated list of types) possible values: StN for tram, BuN for bus, s for suburban
    timeToStation: 10,                  // How long do you need to walk to the next Station?
    timeInFuture: 40,                   // Show departures for the next *timeInFuture* minutes.

    // Look and Feel
    marqueeLongDirections: true,        // Use Marquee effect for long station names?
    replaceInDirections: {},            // key-value pairs which are used to replace `key` by `value` in the displayed directions
    showColoredLineSymbols: true,       // Want colored line symbols?
    useColorForRealtimeInfo: true,      // Want colored real time information (timeToStation, early)?
    showAbsoluteTime: true,             // How should the departure time be displayed? "15:10" (absolute) or "in 5 minutes" (relative)
    showTableHeaders: true,             // Show table headers?
    showTableHeadersAsSymbols: true,    // Table Headers as symbols or written?
    tableHeaderOrder: [ "time", "line", "direction" ], // In which order should the table headers appear?
    maxUnreachableDepartures: 0,        // How many unreachable departures should be shown?
    maxReachableDepartures: 7,          // How many reachable departures should be shown?
    fadeUnreachableDepartures: true,
    fadeReachableDepartures: true,
    fadePointForReachableDepartures: 0.25,
    customLineStyles: "leipzig",        // Prefix for the name of the custom css file. ex: Leipzig-lines.css (case sensitive)
    showOnlyLineNumbers: false          // Display only the line number instead of the complete name, i. e. "11" instead of "STR 11"
  },


  start: function () {
    Log.info("Starting module: " + this.name + " with identifier: " + this.identifier);
    
    var ModulePublicTransportHafasHidden = false; // par défaut on affiche le module (si pas de module carousel ou autre)
	this.updatesIntervalID = 0; 	// to stop and start auto update for each module instance
	var lastUpdate = 0; 	//timestamp of the last module update. set at 0 at start-up

    this.departures = [];
    this.initialized = false;
    this.error = {};

    this.sanitzeConfig();

    if (!this.config.stationID) {
      Log.error("stationID not set! " + this.config.stationID);
      this.error.message = this.translate("NO_STATION_ID_SET");

      return;
    }

    let fetcherOptions = {
      identifier: this.identifier,
      stationID: this.config.stationID,
      timeToStation: this.config.timeToStation,
      timeInFuture: this.config.timeInFuture,
      direction: this.config.direction,
      ignoredLines: this.config.ignoredLines,
      excludedTransportationTypes: this.config.excludedTransportationTypes,
      maxReachableDepartures: this.config.maxReachableDepartures,
      maxUnreachableDepartures: this.config.maxUnreachableDepartures
    };

    this.sendSocketNotification("CREATE_FETCHER", fetcherOptions);
  },

	
	//Modif AgP42 - 12/07/2018
	suspend: function() { //fct core appelée quand le module est caché
		this.ModulePublicTransportHafasHidden = true; //module hidden
		//Log.log("Fct suspend - Module PublicTransportHafas caché" + this.config.stationName);
		this.GestionUpdateIntervalHafas(); //on appele la fonction qui gere tous les cas
	},
	
	resume: function() { //fct core appelée quand le module est affiché
		this.ModulePublicTransportHafasHidden = false;
		//Log.log("Fct resume - Module PublicTransportHafas AFFICHE" + this.config.stationName);
		this.GestionUpdateIntervalHafas();	
	},

	notificationReceived: function(notification, payload) {
		if (notification === "USER_PRESENCE") { // notification envoyée par le module MMM-PIR-Sensor. Voir sa doc
			//Log.log("NotificationReceived USER_PRESENCE = " + payload);
			UserPresence = payload;
			this.GestionUpdateIntervalHafas();
		}
	},
	
	GestionUpdateIntervalHafas: function() {
		if (UserPresence === true && this.ModulePublicTransportHafasHidden === false){ // on s'assure d'avoir un utilisateur présent devant l'écran (sensor PIR) et que le module soit bien affiché
			var self = this;
			//Log.log(this.config.stationName + " est affiché et user present ! On l'update");
	
			// update now and start again the update timer
			this.startFetchingLoop(this.config.updatesEvery);

		}else{ // (UserPresence = false OU ModulePublicTransportHafasHidden = true)
			//Log.log("Personne regarde : on stop l'update !" + this.config.stationName);
			clearInterval(this.updatesIntervalID); // on arrete l'intervalle d'update en cours
			this.updatesIntervalID=0; //on reset la variable
		}
	},
	//Fin AgP

  getDom: function () {
    let domBuilder = new PTHAFASDomBuilder(this.config);

    if (this.hasErrors()) {
      return domBuilder.getSimpleDom(this.error.message);
    }

    if (!this.initialized) {
      return domBuilder.getSimpleDom(this.translate("LOADING"));
    }

    let headings = {
      time: this.translate("PTH_DEPARTURE_TIME"),
      line: this.translate("PTH_LINE"),
      direction: this.translate("PTH_TO")
    };

    let noDeparturesMessage = this.translate("PTH_NO_DEPARTURES");

    var wrapper = domBuilder.getDom(this.departures, headings, noDeparturesMessage);
    
    
    
    		// display the update time at the end, if defined so by the user config
	if(this.config.displayLastUpdate){

		var updateinfo = document.createElement("div");
		updateinfo.className = "xsmall light align-left";
		updateinfo.innerHTML = "Update : " + moment.unix(this.lastUpdate).format(this.config.displayLastUpdateFormat);
		wrapper.appendChild(updateinfo);
	}
		
	return wrapper;
		
  },


  getStyles: function () {
    let styles = [
      this.file("css/styles.css"),
      "font-awesome.css"
    ];

    if (this.config.customLineStyles !== "") {
      let customStyle = "css/" + this.config.customLineStyles + "-lines.css";
      styles.push(this.file(customStyle));
    }

    return styles;
  },


  getScripts: function () {
    return [
      "moment.js",
      this.file("core/PTHAFASDomBuilder.js"),
      this.file("core/PTHAFASTableBodyBuilder.js")
    ];
  },


  getTranslations: function() {
    return {
      en: "translations/en.json",
      de: "translations/de.json"
    };
  },


  socketNotificationReceived: function (notification, payload) {
    if (!this.isForThisStation(payload)) {
      return;
    }

    switch (notification) {
      case "FETCHER_INITIALIZED":
        this.initialized = true;
        this.startFetchingLoop(this.config.updatesEvery); 
		    
        break;

      case "DEPARTURES_FETCHED":
      
		//AgP      			
		if(this.config.displayLastUpdate){
			this.lastUpdate = Date.now() / 1000 ; //save the timestamp of the last update to be able to display it		
		}
			
		Log.log("TransportHafas update OK, station : " + this.config.stationName + " at : " 
			+ moment.unix(this.lastUpdate).format(this.config.displayLastUpdateFormat)); 
			
		//this.sendNotification("SHOW_ALERT",{type:"notification",message:"Update Transport Berlin recue"});
     
        // reset error object
        this.error = {};
        this.departures = payload.departures;
        this.updateDom(2000);

        break;

      case "FETCH_ERROR":
        this.error = payload.error;
        this.departures = [];
        this.updateDom(2000);

        break;
    }
  },


  isForThisStation: function (payload) {
    return payload.identifier === this.identifier;
  },


  sanitzeConfig: function () {
    if (this.config.updatesEvery < 30) {
      this.config.updatesEvery = 30;
    }

    if (this.config.timeToStation < 0) {
      this.config.timeToStation = 0;
    }

    if (this.config.timeInFuture < this.config.timeToStation + 30) {
      this.config.timeInFuture = this.config.timeToStation + 30;
    }

    if (this.config.maxUnreachableDepartures < 0) {
      this.config.maxUnreachableDepartures = 0;
    }

    if (this.config.maxReachableDepartures < 0) {
      this.config.maxReachableDepartures = this.defaults.maxReachableDepartures;
    }
  },


  startFetchingLoop: function(interval) {
    // start immediately ...
    this.sendSocketNotification("FETCH_DEPARTURES", this.identifier);

    // ... and then repeat in the given interval
    
    //Log.log("Hello, update module Transport demandé!! (non récurente)");
	//this.sendNotification("SHOW_ALERT",{type:"notification",message:"Update Transport Berlin demandée"});
    
    if (this.updatesIntervalID === 0){//if this instance as no auto update defined, then we create one. Otherwise : nothing.
		
		this.updatesIntervalID = setInterval(() => {
		  this.sendSocketNotification("FETCH_DEPARTURES", this.identifier);
		}, interval * 1000);
    
    }
    

  },


  hasErrors: function () {
    return (Object.keys(this.error).length > 0);
  },
});

