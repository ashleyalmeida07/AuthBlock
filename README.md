# AuthBlock

**AuthBlock** is a next-generation academic credential registry and verification platform. It leverages the Ethereum blockchain to issue, store, and verify tamper-proof academic credentials (degrees, marksheets, and course certificates) alongside scalable cloud infrastructure powered by Supabase.

## Features

- 🎓 **Admin Issuance Portal**: Streamlined interface for university administrators to issue individual or bulk credentials.
- 🔗 **Blockchain-Backed Security**: Generates unique SHA-256 data hashes for every issued credential and securely anchors them on the Ethereum blockchain via smart contracts, ensuring complete immutability.
- 👨‍🎓 **Student Dashboard**: A personalized dashboard for students to view their issued credentials, download official PDF certificates, and generate shareable Academic Passport QR codes.
- 🛡️ **Multi-Method Verification**:
  - **QR Code Scan**: Instantly verify a credential by scanning a student's AuthBlock QR code (via live camera or image upload).
  - **Certificate ID / PRN Lookup**: Search the registry using a unique Certificate ID or a student's University PRN number.
  - **Document OCR Upload**: Upload a scanned PDF/image of a certificate. The system extracts the data via OCR, regenerates the hash, and matches it directly against the blockchain record.
- 📄 **Dynamic PDF Generation**: Automatically generates visually rich, downloadable degree and marksheet PDFs at issuance.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL & Storage Buckets)
- **Blockchain**: [Ethers.js](https://docs.ethers.org/) (Ethereum/Sepolia Testnet integrations)
- **Authentication**: Custom JWT / Session handling

## Getting Started

### Prerequisites

You will need Node.js installed, as well as accounts/keys for:
- Supabase (URL and Keys)
- An Ethereum RPC Provider (e.g., Infura, Alchemy)
- Wallet Private Key (for deploying/issuing on-chain)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ashleyalmeida07/AuthBlock.git
   cd AuthBlock
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Blockchain configuration
   ETHEREUM_RPC_URL=your-rpc-url
   WALLET_PRIVATE_KEY=your-private-key
   CONTRACT_ADDRESS=your-deployed-contract-address
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## CI/CD Note
This project includes GitHub Actions for automated building. If you fork this repository, ensure your GitHub repository secrets contain the necessary `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables to allow Next.js static generation to compile successfully.
