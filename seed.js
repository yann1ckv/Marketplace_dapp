Eutil = require('ethereumjs-util');
Marketplace = artifacts.require("./Marketplace.sol");

module.exports = function(callback) {
    amt_1 = web3.toWei(1, 'ether');

    Marketplace.deployed().then(function(i) {i.addProduct("iPhone 6", "Cell Phones & Accessories", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", amt_1, 0).then(function(f) {console.log(f)})});
    Marketplace.deployed().then(function(i) {i.addProduct("iPhone X", "Cell Phones & Accessories", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", 2*amt_1, 0).then(function(f) {console.log(f)})});
    Marketplace.deployed().then(function(i) {i.addProduct("Playstion 4 HD", "Gameconsoles", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", 3*amt_1, 0).then(function(f) {console.log(f)})});
    Marketplace.deployed().then(function(i) {i.addProduct("iPhone 7 Plus", "Cell Phones & Accessories", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", 2.5*amt_1, 0).then(function(f) {console.log(f)})});
    Marketplace.deployed().then(function(i) {i.addProduct("Lamborghini Gallardo", "Cell Phones & Accessories", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", "QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1", 100*amt_1, 0).then(function(f) {console.log(f)})});

    Marketplace.deployed().then(function(i) {i.productIndex.call().then(function(f){console.log(f)})});
}
