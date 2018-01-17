pragma solidity ^0.4.18;
import "contracts/Escrow.sol";


contract Marketplace {
    /* ProductStatus[0] == open, ProductStatus[1] == sold etc.. */
    enum ProductStatus { Open, Sold, Unsold }
    enum ProductCondition { New, Used }

    uint public productIndex;

    /* every product can have an address to an escrow contract to store a final bid */
    mapping (uint => address) public productEscrow;

    /* every address can have there own store with listed products, of which every product is a product struct*/
    /* user adds first product: 0x64fcba11d3dce1e3f781e22ec2b61001d2c652e5 => {1 => "struct with iphone details"} */
    mapping (address => mapping(uint => Product)) public stores;

    /* which products are in whose store */
    mapping (uint => address) public productIdInStore;

    /* contract constructor */
    function Marketplace() public {
        productIndex = 0;
    }

    /* event to which the server can listen and then copy the data to mongo when a new product is added */
    event NewProduct(uint _productId, string _name, string _category, string _imageLink, string _descLink,
        uint _startPrice, uint _productCondition);

    event NewBid(address _bidder, uint _productId, uint _amount);

    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string descLink;
        uint startPrice;
        address highestBidder;
        uint highestBid;
        uint totalBids;
        ProductStatus status;
        ProductCondition condition;
        mapping (address => Bid) bids;
    }

    /* add new product */
    function addProduct(string _name, string _category, string _imageLink, string _descLink, uint _startPrice,
        uint _productCondition) public {

        productIndex += 1;

        /* create new product with arguments as input */
        Product memory product = Product(productIndex, _name, _category, _imageLink, _descLink, _startPrice, 0, 0, 0,
        ProductStatus.Open, ProductCondition(_productCondition));

        /* address->productIndex->product */
        stores[msg.sender][productIndex] = product;

        /* productIndex->address */
        productIdInStore[productIndex] = msg.sender;

        /* trigger event to let the front-end know that a new product has been added */
        NewProduct(productIndex, _name, _category, _imageLink, _descLink, _startPrice, _productCondition);
    }

    function getProduct(uint _productId) public view returns (uint, string, string, string, string, uint,
        ProductStatus, ProductCondition, uint, uint) {

        /* fist get address with productnumber, then get the product with that address and id */
        Product memory product = stores[productIdInStore[_productId]][_productId];

        return (product.id, product.name, product.category, product.imageLink, product.descLink,
        product.startPrice, product.status, product.condition, product.totalBids, product.highestBid);
    }

    struct Bid {
        address bidder;
        uint productId;
        uint amount;
    }

    /* bid on a product */
    function bid(uint _productId) public payable returns (bool) {
        Product storage product = stores[productIdInStore[_productId]][_productId];

        require(msg.value > product.startPrice && msg.value > product.highestBid);
        require(product.bids[msg.sender].bidder == 0);

        if (msg.value > product.highestBid) {
            product.highestBid = msg.value;
            product.highestBidder = msg.sender;
        }

        product.bids[msg.sender] = Bid(msg.sender, _productId, msg.value);

        product.totalBids += 1;

        NewBid(msg.sender, _productId, msg.value);

        return true;
    }

    /* see who is the current hightest bidder with the highest bid */
    function highestBidderInfo(uint _productId) public view returns (address, uint) {
        Product memory product = stores[productIdInStore[_productId]][_productId];
        return (product.highestBidder, product.highestBid);
    }

    /* return the total number of bids on a product */
    function totalBids(uint _productId) public view returns (uint) {
        Product memory product = stores[productIdInStore[_productId]][_productId];
        return product.totalBids;
    }

    /* close the auction */
    function closeAuction(uint _productId) public {
        Product storage product = stores[productIdInStore[_productId]][_productId];

        require(productIdInStore[_productId] == msg.sender);
        require(product.status == ProductStatus.Open);

        if (product.totalBids == 0) {
            product.status = ProductStatus.Unsold;
        } else {
            /* Create new escrow contract */
            Escrow escrow = (new Escrow).value(product.highestBid)(_productId, product.highestBidder, msg.sender);

            /* Link the escrow contract to the product */
            productEscrow[_productId] = address(escrow);
            product.status = ProductStatus.Sold;

        }
    }

    function sendToEscrow(uint _productId) {
        Product memory product = stores[productIdInStore[_productId]][_productId];

        require(product.highestBidder == msg.sender);


    }

    /* get the escrow contract address for a product */
    function escrowAddresForProduct(uint _productId) public view returns (address) {
        return productEscrow[_productId];
    }

    /* get all the info on the escrow contract (buyer, seller, fundsDisbursed yes/no) */
    function escrowInfo(uint _productId) public view returns (address, address, bool) {
        return Escrow(productEscrow[_productId]).escrowInfo();
    }

    /* give the funds in the escrow contract to the seller */
    function releaseToSeller(uint _productId) public {
        Escrow(productEscrow[_productId]).releaseToSeller(msg.sender);
    }

    /* refund the funds in the escrow contract to the buyer */
    function refundToBuyer(uint _productId) public {
        Escrow(productEscrow[_productId]).refundToBuyer(msg.sender);
    }

    function stringToUint(string s) private pure returns (uint) {
        bytes memory b = bytes(s);
        uint result = 0;
        for (uint i = 0; i < b.length; i++) {
            if (b[i] >= 48 && b[i] <= 57) {
                result = result * 10 + (uint(b[i]) - 48);
            }
        }
        return result;
    }
}
