import { ethers } from "hardhat";

async function main() {
  // Replace with your deployed address after running deploy.ts
  const counterAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

  const Counter = await ethers.getContractFactory("Counter");
  const counter = Counter.attach(counterAddress);

  console.log("Current count:", (await counter.getCount()).toString());

  console.log("Incrementing...");
  const tx = await counter.increment();
  await tx.wait();

  console.log("New count:", (await counter.getCount()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
