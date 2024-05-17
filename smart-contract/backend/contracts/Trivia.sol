//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Hasher} from "./MiMCSponge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) external;
}

contract Trivia is ERC20Upgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    address public verifier;
    Hasher public hasher;

    IPool public aavePool;
    address public usdcToken;

    uint256 public totalStaked;

    uint256 public constant LOCK_PERIOD = 90 days;
    uint256 public timelockId;

    // Merkle Tree: Can process 2^10 = 1024 leaf node for deposits
    uint8 public treeLevel = 10;

    /* When a new deposit commitment is added to the Merkle tree, 
    it is placed at the location indicated by nextLeafIdex, 
    which is then incremented so that the next deposit commitment knows where it should be placed. */
    uint256 public nextLeafIdex = 0;

    struct timelockTokenInfo {
        address owner;
        uint256 amount;
        uint256 timelockStart;
        bool valid;
    }

    timelockTokenInfo[] public timelockToken;

    // Storing the history of Merkle tree roots
    mapping(uint256 => bool) public roots;
    mapping(uint8 => uint256) public lastLevelHash;
    // Prevent double spending
    mapping(uint256 => bool) public nullifierHashs;
    mapping(uint256 => bool) public commitments;

    uint256[10] levelDefaults = [
        96203452318750999908428454193706286135948977640678371184232379276209525313523,
        55226891951956626373028658136598318915776321229684355582304234122097402342914,
        69818458493260830479308406784255555185891711442998254833072862471426915740367,
        7608667270840240591203663759571510380746798085563624084125285753680016829903,
        83587105579313004870967347925149792441851739297074708888784987781767442769810,
        109449340956139041756136222243572310530284321988098252296150001343832530687643,
        75736964883600798570394158677026783977927324377516022334167573168931188227661,
        97380648565217273888003964070807252469197301499964964936690636197819993676395,
        30616477050580205228098902597845003160548554913840496584284164111158122087135,
        33661038088629468924807864038050025350214116823107928530980956189973152781286
    ];

    event Deposit(
        uint256 indexed root,
        uint256[10] hashPairings,
        uint8[10] pairDirection,
        uint256 amount
    );
    event Withdrawal(
        address indexed user,
        uint256 indexed nullifierHash,
        uint256 amount
    );

    constructor(
        address _hasher,
        address _verifier,
        address _usdcToken,
        address _aavePool
    ) {
        hasher = Hasher(_hasher);
        verifier = _verifier;
        usdcToken = _usdcToken;
        aavePool = IPool(_aavePool);
        __ERC20_init("TRIVIA", "TRIVIA");
        __Ownable_init(msg.sender);
    }

    function deposit(uint256 amount, uint256 _commitment) external {
        require(amount > 0, "Cannot deposit zero tokens");
        require(
            IERC20(usdcToken).balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );
        require(
            IERC20(usdcToken).allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );
        require(!commitments[_commitment], "duplicate commitment hash");
        require(nextLeafIdex < 2 ** treeLevel, "tree full");

        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(usdcToken).approve(address(aavePool), amount);
        aavePool.supply(usdcToken, amount, address(this), 0);

        timelockToken.push(
            timelockTokenInfo({
                owner: msg.sender,
                amount: amount,
                timelockStart: block.timestamp,
                valid: true
            })
        );

        uint256 newRoot; // Merkle tree root
        uint256[10] memory hashPairings;
        uint8[10] memory hashDirections;

        uint256 currentIdx = nextLeafIdex;
        uint256 currentHash = _commitment;

        uint256 left;
        uint256 right;
        uint256[2] memory ins;

        for (uint8 i = 0; i < treeLevel; i++) {
            lastLevelHash[treeLevel] = currentHash;
            // Left node
            if (currentIdx % 2 == 0) {
                left = currentHash;
                right = levelDefaults[i];
                hashPairings[i] = levelDefaults[i];
                hashDirections[i] = 0;
                // Right node
            } else {
                left = lastLevelHash[i];
                right = currentHash;
                hashPairings[i] = lastLevelHash[i];
                hashDirections[i] = 1;
            }

            ins[0] = left;
            ins[1] = right;

            uint256 h = hasher.MiMC5Sponge{gas: 150000}(ins, _commitment);

            currentHash = h;
            // current leaf node moves up to its parent node
            currentIdx = currentIdx / 2;
        }

        newRoot = currentHash;
        roots[newRoot] = true;
        nextLeafIdex += 1;

        commitments[_commitment] = true;

        totalStaked += amount;
        timelockId++;

        emit Deposit(newRoot, hashPairings, hashDirections, amount);
    }

    function withdraw(
        uint256 id,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external {
        require(id < timelockId, "Invalid id");
        timelockTokenInfo storage lockInfo = timelockToken[id];

        require(msg.sender == lockInfo.owner, "Only owner can redeem");
        require(
            block.timestamp >= lockInfo.timelockStart + LOCK_PERIOD,
            "Still in lock period"
        );
        require(lockInfo.valid, "Not valid");

        uint256 _root = _pubSignals[0];
        uint256 _nullifierHash = _pubSignals[1];

        require(!nullifierHashs[_nullifierHash], "already spent");
        require(roots[_root], "not root");

        uint256 _addr = uint256(uint160(msg.sender));

        (bool verifyOK, ) = verifier.call(
            abi.encodeCall(
                IVerifier.verifyProof,
                (_pA, _pB, _pC, [_root, _nullifierHash, _addr])
            )
        );

        require(verifyOK, "invalid proof");

        nullifierHashs[_nullifierHash] = true;

        aavePool.withdraw(usdcToken, lockInfo.amount, address(this));
        IERC20(usdcToken).safeTransfer(msg.sender, lockInfo.amount);
        totalStaked -= lockInfo.amount;
        lockInfo.valid = false;

        emit Withdrawal(msg.sender, _nullifierHash, lockInfo.amount);
    }

    function getReserveInterest() external view returns (uint256) {
        uint256 interest = aavePool.getReserveNormalizedIncome(usdcToken);
        return interest;
    }
}
