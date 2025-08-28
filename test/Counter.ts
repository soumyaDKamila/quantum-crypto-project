import { expect } from "chai";
import { ethers } from "ethers";
import { hre } from "hardhat";
import { Counter } from "../typechain-types";  // auto-generated types

describe("Counter", function () {
  let counter: Counter;

  beforeEach(async function () {
    const Counter = await ethers.getContractFactory("Counter");
    counter = (await Counter.deploy()) as unknown as Counter;
    await counter.waitForDeployment();
  });

  it("should start with a count of 0", async function () {
    const count = await counter.getCount();
    expect(count).to.equal(0n);
  });

  it("should increment the count", async function () {
    await counter.increment();
    const count = await counter.getCount();
    expect(count).to.equal(1n);
  });

  it("should decrement the count", async function () {
    await counter.increment(); // set count = 1
    await counter.decrement();
    const count = await counter.getCount();
    expect(count).to.equal(0n);
  });
});
