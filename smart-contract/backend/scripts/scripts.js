// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
const hre = require("hardhat");

async function main() {
  const TRIVIA = await hre.ethers.getContractFactory("Trivia");
  const trivia_address = "0x5574e61FE92d315Af0715AC3e3db6F61CD7934E7";
  const trivia = await TRIVIA.attach(trivia_address);

  const user = "0xC97705a8FaA9Bec2A50B5bbCc0661251BcB537A4";

  console.log("user balance is:", await trivia.balanceOf(user));

  // const setAdminTx = await trivia.setAdmin(user, true);
  // await setAdminTx.wait();

  const params1 = ["0xC97705a8FaA9Bec2A50B5bbCc0661251BcB537A4"];
  // const params2 = [200];

  // const uploadPointsTx = await trivia.uploadPoints(params1, params2);
  // await uploadPointsTx.wait();

  // const setUsersTx = await trivia.setUsersToReward(params1);
  // await setUsersTx.wait();

  // console.log("total Staked is:", await trivia.nextTimelockId());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
