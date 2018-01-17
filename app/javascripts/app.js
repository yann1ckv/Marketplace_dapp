// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import {
    default as Web3
} from "web3";
import {
    default as contract
} from "truffle-contract";

// Import our contract artifacts and turn them into usable abstractions. (aka get the deployed address and abi so that there can be interacted with the contract)
import marketplace_artifacts from "../../build/contracts/Marketplace.json";

// Create an instance of the contract to interact with
var Marketplace = contract(marketplace_artifacts);

const ipfsAPI = require('ipfs-api')
const ethUtil = require("ethereumjs-util")

// to interact with ipfs Blockchain
const ipfs = ipfsAPI({
    host: 'localhost',
    port: '5001',
    protocol: 'http'
});

// server to make calls to, so that the offchain data can be retrieved
const offchainServer = "http://localhost:3000";
const categories = ["Art", "Books", "Cameras", "Cell Phones & Accessories", "Clothing", "Computers & Tablets", "Gift Cards & Coupons",
    "Musical Instruments & Gear", "Pet Supplies", "Pottery & Glass", "Sporting Goods", "Tickets", "Toys & Hobbies", "Video Games"
];

window.App = {
    start: function() {
        var self = this;

        Marketplace.setProvider(web3.currentProvider);
        renderStore();

        var reader;

        $("#product-image").change(function(event) {
            const file = event.target.files[0]
            reader = new window.FileReader()
            reader.readAsArrayBuffer(file)
        });

        $("#add-item-to-store").submit(function(event) {
            const req = $("#add-item-to-store").serialize();
            let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
            let decodedParams = {}
            Object.keys(params).forEach(function(v) {
                decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
            });
            saveProduct(reader, decodedParams);
            event.preventDefault();
        });

        $("#bidding").submit(function(event) {
            $("#msg").hide();
            let amount = $("#bid-amount").val();
            let productId = $("#product-id").val();
            // insert bid into contract
            Marketplace.deployed().then(function(i) {
                i.bid(parseInt(productId), {
                    value: web3.toWei(amount),
                    from: web3.eth.accounts[0],
                    gas: 440000
                }).then(
                    function(f) {
                        $("#msg").html("Your bid has been successfully submitted!");
                        $("#msg").show();
                        console.log(f)
                    }
                )
            });
            event.preventDefault();
        });

        if ($("#product-details").length > 0) {
            //This is product details page
            let productId = new URLSearchParams(window.location.search).get('product-id');
            renderProductDetails(productId);
        }
    }
};

function renderProductDetails(productId) {
    Marketplace.deployed().then(function(i) {
        i.getProduct.call(productId).then(function(p) {
            let content = "";
            ipfs.cat(p[4]).then(function(stream) {
                content += stream.toString()
                $("#product-desc").append("<div>" + content + "</div>");
            }).catch(err => console.log(err))

            $("#product-image").append("<img src='https://ipfs.io/ipfs/" + p[3] + "' width='250px' />");
            $("#product-price").html(displayPrice(p[5]));
            $("#product-name").html(p[1]);
            $("#product-id").val(p[0].toLocaleString());
            $("#close-auction").hide();
            $("#total-bids").append("<p>" + p[8] + "</p>")
            $("#highest-bid").append("<p>" + p[9] + "</p>")

            if (parseInt(p[6].toLocaleString()) == 1) {
                Marketplace.deployed().then(function(i) {
                    $("#escrow-info").show();
                    i.highestBidderInfo.call(productId).then(function(f) {
                        if (f[2].toLocaleString() == '0') {
                            $("#product-status").html("Auction has ended. No bids were revealed");
                        } else {
                            $("#product-status").html("Auction has ended. Product sold to " + f[0] + " for " + displayPrice(f[2]) +
                                "The money is in the escrow. Two of the three participants (Buyer, Seller and Arbiter) have to " +
                                "either release the funds to seller or refund the money to the buyer");
                        }
                    })
                    i.escrowInfo.call(productId).then(function(f) {
                        $("#buyer").html('Buyer: ' + f[0]);
                        $("#seller").html('Seller: ' + f[1]);
                        if (f[2] == true) {
                            $("#release-count").html("Amount from the escrow has been released");
                        }
                    })
                }).catch(err => console.log(err))
            } else if (parseInt(p[6].toLocaleString()) == 2) {
                $("#product-status").html("Product was not sold");
            } else {
                $("#close-auction").show();
            }
        })
    })
}

$("#release-funds").click(function() {
    let productId = new URLSearchParams(window.location.search).get('id');
    Marketplace.deployed().then(function(f) {
        $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show();
        console.log(productId);
        f.releaseToSeller(productId, {
            from: web3.eth.accounts[0],
            gas: 440000
        }).then(function(f) {
            console.log(f);
            location.reload();
        }).catch(function(e) {
            console.log(e);
        })
    });
});

$("#refund-funds").click(function() {
    let productId = new URLSearchParams(window.location.search).get('id');
    Marketplace.deployed().then(function(f) {
        $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show();
        f.refundToBuyer(productId, {
            from: web3.eth.accounts[0],
            gas: 440000
        }).then(function(f) {
            console.log(f);
            location.reload();
        }).catch(function(e) {
            console.log(e);
        })
    });

    alert("refund the funds!");
});

function renderStore() {
    renderProducts("product-list", {}); // renderProducts("product-list", {});

    categories.forEach(function(value) {
        $("#categories").append("<div>" + value + "");
    })
}

function renderProducts(div, filters) {
    $.ajax({
        url: offchainServer + "/products",
        type: 'get',
        contentType: "application/json; charset=utf-8",
        data: filters
    }).done(function(response) {
        if (response.length == 0) {
            $("#" + div).html('No products found');
        } else {
            $("#" + div).html('');
        }
        while (response.length > 0) {
            let chunks = response.splice(0, 4);
            let row = $("<div/>");
            row.addClass("row");
            chunks.forEach(function(value) {
                let node = buildProduct(value);
                row.append(node);
            })
            $("#" + div).append(row);
        }
    })
}

function buildProduct(product) {
    let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1");
    node.append(
        "<img src='https://ipfs.io/ipfs/" + product.ipfsImageHash + "' width='150px' />"
    );
    node.append("<div>" + product.name + "</div>");
    node.append("<div>" + product.blockchainId + "</div>");
    node.append("<div>" + product.category + "</div>");
    node.append("<div>" + product.condition + "</div>");
    node.append("<div>Ether " + product.price + "</div>");
    node.append("<div><a href='product.html?product-id=" + product.blockchainId + "'>Details</a></div>")
    return node;
}

// return promise to save the image on ipfs
function saveImageOnIpfs(reader) {
    return new Promise(function(resolve, reject) {
        const buffer = Buffer.from(reader.result);
        ipfs.add(buffer)
            .then((response) => {
                console.log(response)
                resolve(response[0].hash);
            }).catch((err) => {
                console.error(err)
                reject(err);
            })
    })
}

// return promise to save the description on ipfs
function saveTextOnIpfs(blob) {
    return new Promise(function(resolve, reject) {
        const descBuffer = Buffer.from(blob, 'utf-8');
        ipfs.add(descBuffer)
            .then((response) => {
                console.log(response)
                resolve(response[0].hash);
            }).catch((err) => {
                console.error(err)
                reject(err);
            })
    })
}

// this function actually saves the image and description + all other parameters on to the Ethereum Blockchain
function saveProduct(reader, decodedParams) {
    let imageId, descId;
    saveImageOnIpfs(reader).then(function(id) {
        imageId = id;
        saveTextOnIpfs(decodedParams["product-description"]).then(function(id) {
            descId = id;
            saveProductToBlockchain(decodedParams, imageId, descId);
        })
    })
}

// Save the whole product on the blockchain
function saveProductToBlockchain(params, imageId, descId) {
    console.log(params);

    Marketplace.deployed().then(function(i) {
        // add the product using the paramaters and hashes for ipfs
        i.addProduct(params["product-name"], params["product-category"], imageId, descId,
            web3.toWei(params["product-price"], 'ether'), parseInt(params["product-condition"]), {
                from: web3.eth.accounts[0],
                gas: 440000
            }).then(function(f) {
            console.log(f);
            $("#msg").show();
            $("#msg").html("Your product was successfully added to your store!");
        })
    });
}

$("#close-auction").submit(function(event) {
    $("#msg").hide();
    let productId = $("#product-id").val();
    Marketplace.deployed().then(function(i) {
        i.closeAuction(parseInt(productId), {
            from: web3.eth.accounts[2],
            gas: 4400000
        }).then(
            function(f) {
                $("#msg").show();
                $("#msg").html("The auction has been finalized and winner declared.");
                console.log(f)
                location.reload();
            }
        ).catch(function(e) {
            console.log(e);
            $("#msg").show();
            $("#msg").html("The auction can not be finalized by the buyer or seller, only a third party aribiter can finalize it");
        })
    });
    event.preventDefault();
});

function displayPrice(amt) {
    return 'Ξ' + web3.fromWei(amt, 'ether');
}

window.addEventListener("load", function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== "undefined") {
        console.warn(
            "Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask"
        );
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.warn(
            "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask"
        );
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(
            new Web3.providers.HttpProvider("http://127.0.0.1:8545")
        );
    }

    App.start();
});
