const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const Exploit = await ethers.getContractFactory("ERC777Exploit");
  const exploit = await Exploit.deploy();

  await exploit.deployed();

  console.log("Exploit deployed to:", exploit.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
