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
  const Tornado = await hre.ethers.getContractFactory("Tornado");
  const tornado = await Tornado.deploy(hasher.address, verifierAddress);
  await tornado.deployed();
  console.log(tornado.address);

  // Verify the Hasher
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying...");
    await verify(hasher.address, []);
    await verify(verifier.address, []);
    await verify(tornado.address, [hasher.address, verifier.address]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
