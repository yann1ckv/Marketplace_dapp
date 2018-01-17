pragma solidity ^0.4.18;


contract Escrow {
    uint public productId;
    address public buyer;
    address public seller;
    uint public amount;
    bool public fundsDisbursed;

    event CreateEscrow(uint _productId, address _buyer, address _seller);
    event UnlockAmount(uint _productId, string _operation, address _operator);
    event DisburseAmount(uint _productId, uint _amount, address _beneficiary);

    /* constructor that creates the escrow contract */
    function Escrow(uint _productId, address _buyer, address _seller) public payable {
        productId = _productId;
        buyer = _buyer;
        seller = _seller;
        amount = msg.value;
        fundsDisbursed = false;
        CreateEscrow(_productId, _buyer, _seller);
    }

    function escrowInfo() public view returns (address, address, bool) {
        return (buyer, seller, fundsDisbursed);
    }

    function releaseToSeller(address caller) public {
        require(!fundsDisbursed);

        if (caller == buyer) {
            UnlockAmount(productId, "release", caller);
            seller.transfer(amount);
            fundsDisbursed = true;
            DisburseAmount(productId, amount, seller);
        }
    }

    function refundToBuyer(address caller) public {
        require(!fundsDisbursed);

        if (caller == seller) {
            UnlockAmount(productId, "refund", caller);
            buyer.transfer(amount);
            fundsDisbursed = true;
            DisburseAmount(productId, amount, buyer);
        }
    }
}
