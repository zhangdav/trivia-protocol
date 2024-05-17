const hre = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");

async function main() {
  // deploy hasher
  const Hasher = await hre.ethers.getContractFactory("Hasher");
  const hasher = await Hasher.deploy();
  await hasher.deployed();
  console.log(hasher.address);

  // deploy verifier
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log(verifier.address);
  const verifierAddress = verifier.address;

  // deploy tornado
  const Trivia = await hre.ethers.getContractFactory("Trivia");
  const trivia = await Trivia.deploy(hasher.address, verifierAddress);
  await trivia.deployed();
  console.log(trivia.address);

  // Verify the Hasher
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying...");
    await verify(hasher.address, []);
    await verify(verifier.address, []);
    await verify(trivia.address, [hasher.address, verifier.address]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
