import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

let provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider;

if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log(`Provider has been set from browser wallet`);
} else {
    provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
    console.log(`Provider URL: ${process.env.PROVIDER_URL}`);
}

export default provider;
