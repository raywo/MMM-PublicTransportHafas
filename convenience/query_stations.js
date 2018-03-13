"use strict";

const createClient = require("hafas-client");
const dbProfile = require("hafas-client/p/db");
const readline = require("readline");
const arrayUnique = require("array-unique");

const client = createClient(dbProfile);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const productMap = {
  bus: "Bus",
  ferry: "Fähre",
  national: "Fernverkehr",
  nationalExp: "Fernverkehr",
  regional: "Regionalverkehr",
  suburban: "S-Bahn",
  subway: "U-Bahn",
  taxi: "Taxi",
  tram: "Tram"
};


rl.question("Geben Sie eine Adresse oder einen Stationsnamen ein: ", (answer) => {
  rl.close();

  const opt = {
    results: 10,
    stations: true,
    adresses: false,
    poi: false
  };

  client.locations(answer, opt).then((response) => {
    console.log("\nGefundene Haltestellen für \"" + answer + "\":\n");

    response.forEach((element) => {
      printStationInfo(element);
    });

    process.exit(0);
  }).catch(console.error);
});


function printStationInfo(element) {
  let id = element.id;
  let name = element.name;
  let products = element.products;

  if (id && name) {
    console.log("> Haltestelle: \"" + name + "\"\n  ID: " + id + "\n  " + refineProducts(products) + "\n");
  }
}


function refineProducts(products) {
  let result = "Verkehrsmittel: ";

  if (!products) {
    return result + "keine";
  }

  let availableProducts = Object.keys(products).filter(key => products[key]);
  let availableProductsReadable = arrayUnique(availableProducts.map(product => productMap[product]));

  return result + availableProductsReadable.join(", ");
}
