# EcoFi: Tokenized Green Bond dApp Frontend Development Brief

## Project Overview

Build a visually stunning, full-stack frontend for our Tokenized Green Bond dApp using React + Ethers.js v6. The application must deliver a seamless, elegant user experience while providing sophisticated blockchain interaction capabilities.

## Design Vision

Create a **premium fintech application** with an environmental focus:

- **Color Palette**: Use a sophisticated gradient scheme with:
  - Primary: Eco-green (#10B981) to eco-blue (#3B82F6)
  - Secondary: Eco-purple (#8A5CF6) to eco-indigo (#4F46E5)
  - Accent: Earth tones and sunrise/sunset gradients for call-to-action elements
  
- **Typography Requirements**:
  - Headings: Use "Montserrat" (weights 600-800) for headings - clean, authoritative, modern
  - Body: "Inter" (weights 300-500) for excellent readability and professional appearance
  - Numeric displays: Consider "DM Mono" or "Roboto Mono" for financial/metric data
  - Font hierarchy: Clear visual distinction between data, labels, and instructions
  
- **Visual Elements**:
  - Glass-morphism cards with subtle backdrop blur
  - Elegant shadows and hover states
  - Animated gradient borders on key elements
  - Interactive particle background with eco-themed colors
  - Micro-interactions on user actions (button clicks, data loading)
  - Custom animated icons for impact metrics and milestones

- **Responsive Design**:
  - Flawless experience from desktop to mobile
  - Adaptive layouts that reorganize rather than simply scale
  - Touch-optimized interactive elements for mobile users

## Technical Requirements

### Core Technologies
- React with functional components and hooks
- Ethers.js v6 for blockchain interaction
- TailwindCSS for styling (with custom extensions for our design system)
- React Router for navigation
- React Query for data fetching/caching
- Framer Motion for advanced animations

### Backend Integration
Contracts Deployed:
- GreenBondEscrow (address: ESCROW_ADDRESS)
- BondToken (address: BOND_TOKEN_ADDRESS)
- ImpactOracle (address: ORACLE_ADDRESS)

ABIs: Use the .json ABIs from Hardhat artifacts folder

Network: Start with Hardhat localhost (chainId 31337)

### Data Visualization
- Integrate recharts.js or D3.js for real-time impact data visualization
- Create animated progress indicators for milestone achievements
- Add time-series visualization for cumulative energy production

### Enhanced Features
1. **Real-time Impact Dashboard**
   - Create a live-updating visualization showing:
     - CO₂ offset calculations (derived from kWh)
     - Equivalent trees planted metrics
     - Environmental impact timeline with projection curves

2. **Investment Simulator**
   - Add an interactive calculator where potential investors can:
     - Simulate different investment amounts
     - See projected environmental impact
     - View estimated returns based on milestone achievements

3. **Investor Community Features**
   - Add a social proof section showing:
     - Total investors participating (unique addresses)
     - Community impact achievements
     - Optional: Leaderboard of top investors (privacy-preserving)

4. **Downloadable Impact Certificates**
   - Generate downloadable PDFs for investors showing:
     - Their personal contribution
     - Environmental impact attribution
     - Certificate with blockchain verification QR code

5. **Document Vault**
   - Create a section for project documentation:
     - Technical specifications of the green energy project
     - Environmental impact assessment reports
     - Regulatory compliance documentation
     - Smart contract audit reports

## UI Requirements

### 1. Investor Dashboard

**Connect Wallet Section**
- Elegant wallet connection interface with MetaMask animation
- Connected address display with ENS integration if available
- Network indicator with guided network switching process
- Wallet balance display (ETH and BOND tokens)

**Buy Bonds Module**
- Premium investment form with:
  - Input box for token amount (in whole tokens)
  - Real-time calculation of cost in ETH
  - Visual feedback showing investment impact
  - Animated transaction status (pending → confirmed)
  - Call `escrow.invest(tokenAmount, { value: cost })`

**Holdings Display**
- Modern dashboard card showing:
  - User's BondToken balance (from `BondToken.balanceOf(address)`)
  - Progress bar showing `escrow.tokensSold()` vs `escrow.capTokens()`
  - Animated counters for key metrics
  - Portfolio valuation section

**Milestone Tracker**
- Interactive milestone visualization showing:
  - Timeline of all milestones from `escrow.milestones(i)`
  - Threshold kWh values with progress indicators
  - Achievement status with animated celebrations when achieved
  - Release BPS amounts with tooltip explanations
  - Event listener for `MilestoneAchieved` events with visual/audio feedback

**Live Impact Metrics**
- Realtime impact dashboard showing:
  - Current `oracle.cumulativeKwh()` with animated counter
  - CO₂ emissions avoided (calculated from kWh)
  - Environmental equivalents (trees planted, carbon offset)
  - Interactive timeline graph of energy generation history
  - Projection curve showing estimated future impact

### 2. Issuer Dashboard (Admin View)

**Authentication**
- Secure access control checking against `escrow.issuer()`
- Elegant transition to issuer view when authorized

**Financial Overview**
- Comprehensive financial dashboard showing:
  - Total funds raised (`escrow.totalRaised()`)
  - Remaining unreleased funds (`address(this).balance - totalReleased`)
  - Funds released by milestone
  - Projected future releases

**Administrative Controls**
- Sale management interface:
  - Countdown timer to sale end date
  - `closeSale()` button that appears when `saleEnd` passes
  - `withdrawRemainder()` button when all milestones are achieved
  - Transaction status indicators and confirmation screens

**Project Milestone Management**
- Detailed milestone tracking interface for project management:
  - Current status of each milestone
  - Required kWh for next milestone
  - Projected dates for milestone achievements
  - Fund release schedule visualization

### 3. Oracle Simulation Interface

**Secure Control Panel**
- Private key input with appropriate security warnings
- Form to submit `deltaKwh` and `deltaCO2` values
- Calls `oracle.pushImpact(deltaKwh, deltaCO2)` using the ORACLE_UPDATER_KEY signer
- Visualizes the impact of the submission on milestone progress
- Shows history of previous impact submissions

**Developer Tools**
- Provide a developer console showing:
  - Transaction details
  - Gas usage statistics
  - Block confirmations
  - Event logs for debugging

## User Experience Requirements

**Notifications System**
- Beautiful toast notifications for:
  - Transaction initiation, confirmation, and failure
  - Milestone achievements
  - Important account actions
  - Network status changes

**Loading States**
- Elegant loading indicators:
  - Skeleton screens instead of spinners where appropriate
  - Contextual loading messages explaining the current process
  - Progress indicators for blockchain transactions

**Error Handling**
- User-friendly error messages:
  - Plain language explanations
  - Suggested solutions
  - Support information when needed
  - Reconnection options for network issues

**Onboarding**
- First-time user experience:
  - Guided walkthrough of key features
  - Explanation of green bond mechanics
  - MetaMask setup assistance
  - Investment tutorial

**Network Detection**
- Sophisticated network monitoring:
  - Warning when not connected to localhost:31337
  - One-click network switching
  - Connection quality indicators
  - Automatic reconnection attempts

## Expected User Flow

1. **Investor Journey**
   - User connects wallet through elegant onboarding process
   - Views available bond offerings with impact projections
   - Purchases tokens with real-time transaction tracking
   - Receives visual confirmation of successful investment
   - Monitors impact metrics and milestone achievements
   - Downloads impact certificate for their contribution

2. **Issuer Journey**
   - Authorized user accesses issuer dashboard
   - Monitors sales progress and funds raised
   - Reviews impact data submissions
   - Manages project milestones and fund releases
   - Closes sale when appropriate
   - Withdraws remainder when all milestones complete

3. **Oracle Simulation**
   - Authorized user accesses oracle control panel
   - Submits new cumulative kWh data
   - System visualizes the impact on milestones
   - Triggers milestone achievements when thresholds reached
   - Updates all dashboards with new impact metrics

## Development Guidelines

- Use atomic design principles for component architecture
- Implement proper React performance optimizations (memoization, etc.)
- Follow strict TypeScript typing for all blockchain interactions
- Create comprehensive unit and integration tests
- Document all components with Storybook
- Optimize bundle size and loading performance
- Ensure WCAG 2.1 AA accessibility compliance
- Implement comprehensive error boundary system

## Delivery Requirements

- Complete source code with documentation
- Component library with Storybook documentation
- Comprehensive test suite
- Deployment scripts for various environments
- User guide and administrator documentation

## Technical Appendix

Include all contract ABIs, addresses, and technical specifications for blockchain interaction in this section.

---

We're looking for a frontend that not only meets functional requirements but delivers a stunning, premium user experience that reflects the innovative nature of our green bond platform. The interface should be intuitive enough for crypto newcomers while providing the depth needed by experienced investors.