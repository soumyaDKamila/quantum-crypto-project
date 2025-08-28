import { ethers } from "hardhat";
import { MyToken } from "../../typechain-types";

export async function deployMyToken(): Promise<MyToken> {
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = (await MyToken.deploy()) as unknown as MyToken;
  await token.waitForDeployment();
  return token;
}
