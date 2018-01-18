export default window.App = {
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
            let productId = $("#product-id").val()
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
            let productId = $("#product-id").val()
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
            let productId = $("#product-id").val()
            Marketplace.deployed().then(function(i) {
                i.getProduct.call(parseInt(productId)).then(function(p) {
                    let bid = p[9].toLocaleString()
                    console.log(bid)
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

        if ($("#product-details").length > 0) {
            //This is product details page
            let productId = new URLSearchParams(window.location.search).get('product-id')
            renderProductDetails(productId)
        }

        // funds go from escrow contract to seller
        $("#release-funds").click(function() {
            console.log('release')
            let productId = new URLSearchParams(window.location.search).get('id')
            Marketplace.deployed().then(function(f) {
                $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show()
                f.releaseToSeller(productId, {
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
            let productId = new URLSearchParams(window.location.search).get('id')
            Marketplace.deployed().then(function(f) {
                $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show()
                f.refundToBuyer(productId, {
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
    }
};
