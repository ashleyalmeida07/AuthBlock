import { ethers } from 'ethers';
import ContractABI from './ContractABI.json';
import QRContractABI from './QRContractABI.json';
import DegreeContractABI from './DegreeContractABI.json';
import CourseContractABI from './CourseContractABI.json';

const RPC_URL = process.env.ALCHEMY_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

function getProviderAndWallet() {
  if (!RPC_URL || !PRIVATE_KEY) {
    throw new Error('Blockchain configuration is missing (RPC_URL or PRIVATE_KEY).');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  return { provider, wallet };
}

// ── Marksheet (CertificateRegistry) ──────────────────────────────
export async function getBlockchainContract() {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is missing.');
  const { provider, wallet } = getProviderAndWallet();
  const contract = new ethers.Contract(address, ContractABI, wallet);
  return { provider, wallet, contract };
}

// ── QR Scan Logger ───────────────────────────────────────────────
export async function getQRBlockchainContract() {
  const address = process.env.NEXT_PUBLIC_QR_CONTRACT_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_QR_CONTRACT_ADDRESS is missing.');
  const { provider, wallet } = getProviderAndWallet();
  const contract = new ethers.Contract(address, QRContractABI, wallet);
  return { provider, wallet, contract };
}

// ── Final Degree (DegreeRegistry) ────────────────────────────────
export async function getDegreeBlockchainContract() {
  const address = process.env.NEXT_PUBLIC_DEGREE_CONTRACT_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_DEGREE_CONTRACT_ADDRESS is missing.');
  const { provider, wallet } = getProviderAndWallet();
  const contract = new ethers.Contract(address, DegreeContractABI, wallet);
  return { provider, wallet, contract };
}

// ── Course Certificate (CourseRegistry) ──────────────────────────
export async function getCourseBlockchainContract() {
  const address = process.env.NEXT_PUBLIC_COURSE_CONTRACT_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_COURSE_CONTRACT_ADDRESS is missing.');
  const { provider, wallet } = getProviderAndWallet();
  const contract = new ethers.Contract(address, CourseContractABI, wallet);
  return { provider, wallet, contract };
}

// ── Dynamic dispatcher by document type ──────────────────────────
export type DocType = 'marksheet' | 'degree' | 'course';

export async function getContractByDocType(docType: DocType) {
  switch (docType) {
    case 'marksheet': return getBlockchainContract();
    case 'degree':    return getDegreeBlockchainContract();
    case 'course':    return getCourseBlockchainContract();
    default:          throw new Error(`Unknown document type: ${docType}`);
  }
}
