# ERC777 Exploit

This project uses the ERC777 hook to exploit the Lendf.Me platform.

First run a local forked mainnet to execute transactions on.

```shell
yarn hardhat  node
```

Run the following to compile and deploy the contracts to your local network.

```shell
yarn hardhat run --network localhost scripts/deploy.js
```

Run the following command to execute the attack.

```shell
yarn hardhat run --network localhost scripts/attack.js
```