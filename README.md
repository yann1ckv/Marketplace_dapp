![alt text](https://github.com/yvisbeek/Marketplace_dapp/blob/master/img/Homepage.png "Screenshot 1")

# Marketplace_dapp

Simple decentralized auctioning website on the Ethereum Blockchain. An agreement to sell creates an obligation for the buyer to deposit ether in an escrow contract, where the money is stored until the buyer agrees to release the money to the sellers'
account or the seller agrees to refund the money to the buyers' account.

## Site

#### Landing Page

The user should be logged in using MetaMask. He or she then has the ability to either list a new item or view details of already listed items.

![alt text](https://github.com/yvisbeek/Marketplace_dapp/blob/master/img/gif1.gif "Gif 1")


It is also possible to make bids on already listed items.

![alt text](https://github.com/yvisbeek/Marketplace_dapp/blob/master/img/gif2.gif "Gif 2")


After an auction is closed, the winner of the auction sends ether to an escrow account, in which it stays until either the buyer releases the funds to the seller or the seller refunds the funds to the buyer.

![alt text](https://github.com/yvisbeek/Marketplace_dapp/blob/master/img/gif4.gif "Gif 4")


Once there are funds in the escrow contract, the buyer can decide to release the funds upon receiving the product.

![alt text](https://github.com/yvisbeek/Marketplace_dapp/blob/master/img/gif5.gif "Gif 5")

## Installation

Start by cloning this repository.

```
git clone https://github.com/yvisbeek/Marketplace_dapp.git
```

You will also need a working node.js setup ([instructions](https://github.com/nodejs/node/wiki)) and globally installed ganache-cli ([instructions](https://github.com/trufflesuite/ganache-cli)).

### Install dependencies

```
cd Marktplaats
npm install
```

Install MongoDB

`https://docs.mongodb.com/manual/installation/`

Install IPFS

`https://ipfs.io/docs/install/`


## Deployment

Open a new terminal window and start a local blockchain using the ganache command-line-interface

```
1. ganache-cli
2. use the mnemonic to login to Metamask on localhost 8545
```

Open another terminal window and compile the contracts and migrate them to the blockchain
```
3. truffle compile
4. truffle migrate
5. npm run dev (start the dev server on localhost:8080)
```
Open another terminal window and run MongoDB

```
6. mongod
```

Open another terminal window and run the server that listens to activity on the blockchain and interacts with MongoDB

```
7. nodemon server.js
```

Open another terminal windows and start an IPFS connection

```
8. ipfs daemon
```

The app should now be running on http://localhost:8080

## Built with

- [Node.js](https://nodejs.org/en/) - Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine.
- [IPFS](https://ipfs.io/) - A peer-to-peer hypermedia protocol to make the web faster, safer, and more open.
- [Ethereum](https://www.ethereum.org/) - Ethereum is a decentralized platform that runs smart contracts: applications that run exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference.
- [jQuery - Ajax](http://www.w3schools.com/jquery/jquery_ref_ajax.asp) - jQuery simplifies HTML document traversing, event handling, animating, and Ajax interactions for rapid web development.
- [Truffle Framework](http://truffleframework.com/) - Truffle is the most popular development framework for Ethereum with a mission to make your life a whole lot easier.
- [MongoDB](https://www.mongodb.com/) - MongoDB is a document database with the scalability and flexibility that you want with the querying and indexing that you need.
- [Ganache-cli](http://truffleframework.com/ganache/) - Quickly fire up a personal Ethereum blockchain which you can use to run tests, execute commands, and inspect state while controlling how the chain operates.
- [MetaMask](https://metamask.io/) - MetaMask is a bridge that allows you to visit the distributed web of tomorrow in your browser today. It allows you to run Ethereum dApps right in your browser without running a full Ethereum node.

## License
>You can check out the full license [here](https://github.com/yvisbeek/Marketplace_dapp/blob/master/LICENSE)

This project is licensed under the terms of the **MIT** license.
