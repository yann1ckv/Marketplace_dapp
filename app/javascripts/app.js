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
})

// server to make calls to, so that the offchain data can be retrieved
const offchainServer = "http://localhost:3000"
const categories = ["Art", "Books", "Cameras", "Cell Phones & Accessories", "Clothing", "Computers & Tablets", "Gift Cards & Coupons",
    "Musical Instruments & Gear", "Pet Supplies", "Pottery & Glass", "Sporting Goods", "Tickets", "Toys & Hobbies", "Video Games"
]

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
            let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
            let decodedParams = {}
            Object.keys(params).forEach(function(v) {
                decodedParams[v] = decodeURIComponent(decodeURI(params[v]))
            });
            saveProduct(reader, decodedParams)
            event.preventDefault()
        });

        $("#bidding").submit(function(event) {
            $("#msg").hide();
            let amount = $("#bid-amount").val()
            let productId = new URLSearchParams(window.location.search).get('product-id')
            // insert bid into contract
            console.log(amount + ' for ' + productId + ' by ' + web3.eth.accounts[0])
            Marketplace.deployed().then(function(i) {
                let bid = web3.toWei(amount)
                i.bid(parseInt(productId), bid, {
                    from: web3.eth.accounts[0],
                    gas: 440000
                }).then(
                    function(f) {
                        $("#msg").html("Your bid has been successfully submitted!")
                        $("#msg").show()
                        console.log(f)
                    }
                )
            })
            event.preventDefault()
        });

        $("#close-auction").submit(function(event) {
            $("#msg").hide()
            let productId = new URLSearchParams(window.location.search).get('product-id')
            Marketplace.deployed().then(function(i) {
                i.closeAuction(parseInt(productId), {
                    from: web3.eth.accounts[0],
                    gas: 4400000
                }).then(
                    function(f) {
                        $("#msg").show()
                        $("#msg").html("The auction has been closed.")
                        console.log(f)
                        location.reload()
                    }
                ).catch(function(e) {
                    console.log(e)
                    $("#msg").show()
                    $("#msg").html("The auction can only be closed by the owner of the auction")
                })
            });
            event.preventDefault()
        })

        $("#escrow-send").click(function() {
            let productId = new URLSearchParams(window.location.search).get('product-id')
            Marketplace.deployed().then(function(i) {
                i.getProduct.call(parseInt(productId)).then(function(p) {
                    let bid = p[9].toLocaleString()
                    i.sendToEscrow(parseInt(productId), {
                        value: bid,
                        from: web3.eth.accounts[0],
                        gas: 4400000
                    }).then(
                        function(f) {
                            $("#msg").show()
                            $("#msg").html("You've sent money to the escrow contract.")
                            console.log(f)
                        }
                    )
                })
                i.escrowAddresForProduct.call(parseInt(productId)).then(function(p) {
                    web3.eth.getBalance(p, function(err, result) {
                        console.log(result)
                    })
                })
            })
        })

        // funds go from escrow contract to seller
        $("#release-funds").click(function() {
            console.log('release')
            let productId = new URLSearchParams(window.location.search).get('product-id')
            Marketplace.deployed().then(function(f) {
                $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show()
                f.releaseToSeller(parseInt(productId), {
                    from: web3.eth.accounts[0],
                    gas: 440000
                }).then(function(f) {
                    console.log(f)
                    location.reload()
                }).catch(function(err) {
                    console.log(err)
                })
            })
        })

        // funds go from escrow contract back to buyer
        $("#refund-funds").click(function() {
            console.log('refund')
            let productId = new URLSearchParams(window.location.search).get('product-id')
            Marketplace.deployed().then(function(f) {
                $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show()
                f.refundToBuyer(parseInt(productId), {
                    from: web3.eth.accounts[0],
                    gas: 440000
                }).then(function(f) {
                    console.log(f)
                    location.reload()
                }).catch(function(err) {
                    console.log(err)
                })
            })
        })

        // if there are any product details, render them
        if ($("#product-details").length > 0) {
            let productId = new URLSearchParams(window.location.search).get('product-id')
            renderProductDetails(productId)
        }
    }
};

// render single product on page
function renderProductDetails(productId) {
    $.ajax({
        url: offchainServer + "/product",
        type: 'get',
        contentType: "application/json; charset=utf-8",
        data: {
            productId: productId
        }
    }).done(function(response) {
        let content = "";
        ipfs.cat(response.ipfsDescHash).then(function(stream) {
            content += stream.toString()
            $("#product-desc").append("<div>" + content + "</div>");
        }).catch(err => console.log(err))

        $("#product-image").append("<img src='https://ipfs.io/ipfs/" + response.ipfsImageHash + "' width='250px' />");
        $("#product-price").html(displayPrice(response.price));
        $("#product-name").html(response.name);
        $("#product-id").val(response.blockchainId);
        $("#close-auction").hide();
        $("#total-bids").append("<p>" + response.bids.length + "</p>")

        // loop for highest bid
        let data = response.bids
        let max_bid = Math.max(...data.map(o => o.amount));

        if (max_bid == "-Infinity") {
            max_bid = "No bids yet"
        }

        $("#highest-bid").append("<p>" + max_bid + "</p>")

        Marketplace.deployed().then(function(j) {
            j.getProduct.call(productId).then(function(p) {
                if (parseInt(p[6].toLocaleString()) == 1) {
                    $("#bidding").html('<div>This auction has ended</div>')
                    j.highestBidderInfo.call(productId).then(function(f) {
                        j.escrowAddresForProduct.call(productId).then(function(p) {
                            $("#escrow-info").html(`Auction has ended. Product sold to ${f[0]} for ${displayPrice(f[1])}`)
                            // this is the buyer and the escrow contract is yet to be created
                            if (f[0] == web3.eth.accounts[0] && p == '0x0000000000000000000000000000000000000000') {
                                console.log('You are the buyer, do you want to send money to the escrow?')
                                $('#escrow-send').append('<a id="send-to-escrow" class="btn form-submit">Send amount to escrow contract!</a>')
                                // this is the buyer and the escrow contract exists, so money can be sent from the escrow contract to the seller
                            } else if (p == '0x0000000000000000000000000000000000000000') {
                                $('#escrow-send').append('This product was sold, buyer has to send money to the escrow contract')
                            }
                            if (p != '0x0000000000000000000000000000000000000000') {
                                j.escrowInfo.call(productId).then(function(q) {
                                    console.log(`buyer: ${q[0]}`)
                                    console.log(`seller: ${q[1]}`)
                                    if (q[0] == web3.eth.accounts[0] && q[2] == false) {
                                        console.log('You\'ve sent money to the escrow contract, release it to the seller when you have received the product')
                                        $('#release-funds').show()
                                        $('#release-funds').html('<button class="btn form-submit">Release Amount to Seller</button>')
                                    } else if (q[1] == web3.eth.accounts[0] && q[2] == false) {
                                        console.log('hey there seller, the money is in the escrow, do you want to send it back?')
                                        $('#refund-funds').show()
                                        $('#refund-funds').html('<button class="btn form-submit">Refund Amount to Buyer</button>')
                                    } else if (q[2] == true) {
                                        $("#escrow-released").show()
                                        $("#escrow-released").html("Amount from the escrow has been released. This transaction is finished");
                                    }
                                }).catch(err => console.log(err))
                            }
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                } else if (parseInt(p[6].toLocaleString()) == 2) {
                    $("#product-status").html("Product was not sold");
                } else {
                    console.log('nog niet verkocht')
                    $("#close-auction").show();
                }
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}

function renderStore() {
    renderProducts("product-list", {});
    categories.forEach(function(value) {
        $("#categories").append("<div>" + value + "");
    })
}

// render the productpage
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
    let node = $("<div/>")
    node.addClass("col-sm-3 text-center col-margin-bottom-1")
    node.append(
        "<img src='https://ipfs.io/ipfs/" + product.ipfsImageHash + "' width='150px' />"
    );
    node.append("<div>" + product.name + "</div>")
    node.append("<div>Price: " + product.price + "</div>")
    node.append("<div>" + product.category + "</div>")
    node.append("<div><a href='product.html?product-id=" + product.blockchainId + "'>Details</a></div>")
    return node;
}

// return promise to save the image on ipfs
function saveImageOnIpfs(reader) {
    return new Promise(function(resolve, reject) {
        const buffer = Buffer.from(reader.result);
        ipfs.add(buffer)
            .then((response) => {
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
    console.log(params["product-condition"])
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

// convert from Wei to Ether
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
