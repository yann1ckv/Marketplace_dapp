const marketplace_artifacts = require('./build/contracts/Marketplace.json')
const contract = require('truffle-contract')
const Web3 = require('Web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const Marketplace = contract(marketplace_artifacts)
Marketplace.setProvider(provider)

const mongoose = require('mongoose')
const ProductModel = require('./product')

// since mongoose promise is deprecated, make mongoose methods use the ES6 promise
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/marketplace_dapp");
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))

const express = require('express');
const app = express();
const port = 3000;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// eventlistener function, saves a product to a mongodb when it gets listed
function productEventListener() {
    let productEvent;
    Marketplace.deployed().then(function(i) {
        productEvent = i.NewProduct({
            fromBlock: 0,
            toBlock: 'latest'
        })

        productEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            saveProduct(result.args)
        })
    })
}

productEventListener()

function saveProduct(product) {
    // first check if the product is already in the database, if it is, exit the functino
    ProductModel.findOne({
        'blockchainId': product._productId.toLocaleString()
    }, function(err, result) {
        if (result != null) {
            return
        }

        // create product
        var p = new ProductModel({
            name: product._name,
            blockchainId: product._productId,
            category: product._category,
            ipfsImageHash: product._imageLink,
            ipfsDescHash: product._descLink,
            price: product._startPrice,
            condition: product._productCondition,
            productStatus: 0
        });

        // save product to the database
        p.save(function(err) {
            if (err) {
                handleError(err)
            } else {
                ProductModel.count({}, function(err, count) {
                    console.log(`count is ${count}`)
                })
            }
        })
    })
}

app.get('/', function(req, res) {
    res.send('Hello World!')
})

app.get('/products', function(req, res) {
    query = {
        productStatus: {
            $eq: 0
        }
    }

    if (req.query.category !== undefined) {
        query['category'] = {
            $eq: req.query.category
        }
    } else if (req.query.productStatus !== undefined) {
        if (req.query.productStatus == 'close') {
            query['productStatus'] = {
                $eq: 0
            }
        }
    }

    ProductModel.find(query, null, {}, function(err, items) {
        console.log(items.length);
        res.send(items);
    })
})

app.listen(port, function() {
    console.log(`Marketplace listening on ${port}`)
})
