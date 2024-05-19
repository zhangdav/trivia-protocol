//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {Hasher} from "./MiMCSponge.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) external;
}

contract Trivia is Ownable, ERC20, AutomationCompatibleInterface {
    address public verifier;
    Hasher public hasher;

    IPool public aavePool;
    IERC20 public usdcToken;

    uint256 public totalStaked;

    uint256 public constant LOCK_PERIOD = 30 seconds; // default: 30 days
    uint256 public constant WEEKLY_CYCLE_DURATION = 7 minutes; // default: 7 days
    uint256 public lastRewardTimestamp;
    uint256 public nextTimelockId;

    uint256 public constant ADDITIONAL_INTEREST_PRECISION = 1e2;
    uint256 public constant ELIGIBILITY_AMOUNT = 10e6;
    uint256 public constant REWARD_SCALE = 100;

    // Merkle Tree: Can process 2^10 = 1024 leaf node for deposits
    uint8 public treeLevel = 10;

    /* When a new deposit commitment is added to the Merkle tree, 
    it is placed at the location indicated by nextLeafIdex, 
    which is then incremented so that the next deposit commitment knows where it should be placed. */
    uint256 public nextLeafIdex = 0;

    uint8 public constant DECIMALS = 6;

    struct timelockTokenInfo {
        address owner;
        uint256 amount;
        uint256 timelockStart;
        bool valid;
    }

    timelockTokenInfo[] public timelockToken;

    address[] public usersToReward;

    // Storing the history of Merkle tree roots
    mapping(uint256 => bool) public roots;
    mapping(uint8 => uint256) public lastLevelHash;
    // Prevent double spending
    mapping(uint256 => bool) public nullifierHashs;
    mapping(uint256 => bool) public commitments;

    mapping(address => bool) public isWhitelisted;

    mapping(address => uint256) public stakerUSDCAmount;

    mapping(address => uint256) public userPoints;

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
        uint256 amount,
        uint256 id
    );
    event Withdrawal(
        address indexed user,
        uint256 indexed nullifierHash,
        uint256 amount
    );
    event PointsUploaded(address indexed user, uint256 points);

    event RewardsDistributed(address indexed user, uint256 rewardAmount);

    constructor(
        address _hasher,
        address _verifier,
        address _usdcToken,
        address _aavePool
    ) ERC20("Trivia", "Triva") Ownable(msg.sender) {
        hasher = Hasher(_hasher);
        verifier = _verifier;
        usdcToken = IERC20(_usdcToken);
        aavePool = IPool(_aavePool);
        lastRewardTimestamp = block.timestamp;
    }

    function setUsersToReward(address[] calldata users) external onlyOwner {
        usersToReward = users;
    }

    function deposit(uint256 amount, uint256 _commitment) external {
        require(amount > 0, "Cannot deposit zero tokens");
        require(
            usdcToken.balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );
        require(
            usdcToken.allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );
        require(!commitments[_commitment], "duplicate commitment hash");
        require(nextLeafIdex < 2 ** treeLevel, "tree full");

        usdcToken.transferFrom(msg.sender, address(this), amount);
        usdcToken.approve(address(aavePool), amount);
        aavePool.supply(address(usdcToken), amount, address(this), 0);
        mint(msg.sender, amount);

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

        stakerUSDCAmount[msg.sender] += amount;
        totalStaked += amount;
        nextTimelockId++;

        uint256 timeLockId = nextTimelockId - 1;

        emit Deposit(newRoot, hashPairings, hashDirections, amount, timeLockId);
    }

    function withdraw(
        uint256 id,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external {
        require(id < nextTimelockId, "Invalid id");
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

        uint256 withdrawableAmount = balanceOf(msg.sender);

        require(
            usdcToken.balanceOf(address(this)) >= withdrawableAmount,
            "Contract insufficient balance"
        );

        transferFrom(msg.sender, address(this), withdrawableAmount);
        _burn(address(this), withdrawableAmount);

        aavePool.withdraw(address(usdcToken), lockInfo.amount, address(this));
        usdcToken.transfer(msg.sender, withdrawableAmount);

        totalStaked -= lockInfo.amount;
        stakerUSDCAmount[msg.sender] -= lockInfo.amount;
        lockInfo.valid = false;

        emit Withdrawal(msg.sender, _nullifierHash, withdrawableAmount);
    }

    function calcReward(address user) public view returns (uint256) {
        uint256 userStake = stakerUSDCAmount[user];
        uint256 totalInterest = checkTotalInterest();
        uint256 rewardAmount = ((userStake * userPoints[user] * totalInterest) *
            REWARD_SCALE) / totalStaked;

        return rewardAmount / REWARD_SCALE;
    }

    function distributeRewards(address[] memory users) internal {
        for (uint256 i = 0; i < users.length; i++) {
            uint256 rewardAmount = calcReward(users[i]);
            if (rewardAmount > 0) {
                mint(users[i], rewardAmount);
                emit RewardsDistributed(users[i], rewardAmount);
            }
            userPoints[users[i]] = 0;
        }
    }

    function checkTotalInterest() public view returns (uint256) {
        (uint256 totalCollateralBase, , , , , ) = getAccountInformation();
        uint256 totalInterest = totalCollateralBase -
            (totalStaked * ADDITIONAL_INTEREST_PRECISION) /
            ADDITIONAL_INTEREST_PRECISION;
        return totalInterest;
    }

    function getAccountInformation()
        internal
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor
        ) = aavePool.getUserAccountData(address(this));
        return (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor
        );
    }

    function checkEligibility(address user) external view returns (bool) {
        if (stakerUSDCAmount[user] < ELIGIBILITY_AMOUNT) {
            return false;
        } else {
            return true;
        }
    }

    function uploadPoints(
        address[] calldata users,
        uint256[] calldata points
    ) external onlyOwner {
        require(
            users.length == points.length,
            "Users and points length mismatch"
        );

        for (uint256 i = 0; i < users.length; i++) {
            userPoints[users[i]] += points[i];
            emit PointsUploaded(users[i], points[i]);
        }
    }

    function checkUpkeep(
        bytes calldata
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = (usersToReward.length > 0 ||
            (block.timestamp - lastRewardTimestamp) >= WEEKLY_CYCLE_DURATION);
        return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata) external override {
        if (
            usersToReward.length > 0 ||
            (block.timestamp - lastRewardTimestamp) >= WEEKLY_CYCLE_DURATION
        ) {
            distributeRewards(usersToReward);
            delete usersToReward;
            lastRewardTimestamp = block.timestamp;
        }
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
}
