"use strict";

const createClient = require('hafas-client');
const dbProfile = require('hafas-client/p/db');
const client = createClient(dbProfile);

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Geben Sie eine Adresse oder einen Stationsnamen ein: ", (answer) => {
  rl.close();

  const opt = {
    results: 10,
    stations: true
  };

  client.locations(answer, opt).then((response) => {
    console.log("\nGefundene Haltestellen für \"" + answer + "\":\n");

    response.map((element) => {
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

  let productNames = [];

  if (products.national || products.nationalExp) {
    productNames.push("Fernverkehr");
  }

  if (products.regional) {
    productNames.push("Regionalverkehr");
  }

  if (products.suburban) {
    productNames.push("S-Bahn");
  }

  if (products.bus) {
    productNames.push("Bus");
  }

  if (products.subway) {
    productNames.push("U-Bahn");
  }

  if (products.tram) {
    productNames.push("Tram");
  }

  if (products.ferry) {
    productNames.push("Fähre");
  }

  if (products.taxi) {
    productNames.push("Taxi");
  }

  return result + productNames.join(", ");
}
