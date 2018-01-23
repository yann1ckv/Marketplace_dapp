![alt text](https://github.com/yvisbeek/Marketplace_dapp/blob/master/img/Homepage.png "Screenshot 1")

# Marketplace_dapp

Simple decentralized auctioning website on the Ethereum Blockchain. An agreement to sell creates an obligation for the buyer to deposit ether in an escrow contract, where the money is stored untill to buyer agrees to release the money to the sellers'
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
