import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken } from "../typechain-types";
import { deployMyToken } from "./MyToken";

describe("MyToken", function () {
  let myToken: MyToken;
  let owner: any, addr1: any, addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    myToken = (await MyToken.deploy()) as unknown as MyToken;
    await myToken.waitForDeployment();
  });

  it("should assign the total supply to the owner", async function () {
    const ownerBalance = await myToken.balanceOf(await owner.getAddress());
    const totalSupply = await myToken.totalSupply();
    expect(ownerBalance).to.equal(totalSupply);
  });

  it("should allow transfers between accounts", async function () {
    const transferAmount = ethers.parseEther("10");
    await myToken.transfer(await addr1.getAddress(), transferAmount);

    expect(await myToken.balanceOf(await addr1.getAddress())).to.equal(
      transferAmount
    );
  });

  it("should fail if sender doesn’t have enough tokens", async function () {
    const balance = await myToken.balanceOf(await addr1.getAddress());
    const tooMuch = balance + ethers.parseEther("1");

    await expect(
      myToken.connect(addr1).transfer(await addr2.getAddress(), tooMuch)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should update balances after transfer", async function () {
    const transferAmount = ethers.parseEther("5");
    await myToken.transfer(await addr1.getAddress(), transferAmount);

    expect(await myToken.balanceOf(await addr1.getAddress())).to.equal(
      transferAmount
    );
    expect(await myToken.balanceOf(await owner.getAddress())).to.equal(
      (await myToken.totalSupply()) - transferAmount
    );
  });
});
