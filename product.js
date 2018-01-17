const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;


const ProductSchema = new Schema({
    blockchainId: Number,
    name: String,
    category: String,
    ipfsImageHash: String,
    ipfsDescHash: String,
    price: Number,
    condition: Number,
    productStatus: Number
});

const ProductModel = mongoose.model('ProductModel', ProductSchema);

module.exports = ProductModel;
