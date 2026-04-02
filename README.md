# 🏺 WealthWise

> A premium, real-time investing command center for tracking portfolio movement, financial goals, and market context.

WealthWise is designed to give you a clear, consolidated view of your financial health. From live portfolio tracking to automated market data synchronization, it provides the tools you need to make informed investing decisions.

---

## ✨ Key Features

- **💹 Real-time Portfolio Overview**: Live tracking of your total invested value, current holdings, and performance metrics.
- **🎯 Financial Goal Tracking**: Define and monitor your progress toward specific financial objectives with automatic contribution calculations.
- **📊 Asset Allocation Mix**: Visualize your diversification across different fund categories and asset classes.
- **🔄 Automated Market Sync**: Python-powered background workers that keep Ihrer market snapshots and fund masters up to date.
- **🔐 Secure Authentication**: Integrated with Supabase Auth for seamless and secure access via email/password or Google OAuth.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth & Database**: [Supabase](https://supabase.com/)
- **Components**: Custom, high-performance UI components

### Backend & Data
- **Scripts**: Python 3.12+ (for data ingestion and cleaning)
- **Database**: PostgreSQL (via Supabase)
- **API**: Next.js Route Handlers + Supabase PostgREST

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.10+
- A Supabase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VTU-INTERN-TEAM8-JAVA-2026/WealthWise.git
   cd WealthWise
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for scripts)
   ```

4. **Install Python Dependencies (for sync scripts)**:
   ```bash
   # It is recommended to use a virtual environment
   python -m venv venv
   source venv/bin/activate # or venv\Scripts\activate on Windows
   # Note: Scripts currently use standard libraries (urllib, json) for zero-dependency portability
   ```

### Running the App

- **Development Server**:
  ```bash
  npm run dev
  ```

- **Sync Market Data**:
  ```bash
  cd scripts
  ./run_market_sync.bat # On Windows
  # or
  python sync_market_snapshots.py
  ```

---

## 📁 Project Structure

```text
├── scripts/          # Python data synchronization workers
├── src/
│   ├── app/          # Next.js App Router (Pages & API)
│   ├── components/   # Shared UI components
│   ├── lib/          # Utilities, types, and clients
├── public/           # Static assets
└── data/             # Local data cache/exports
```

---

## 🤝 Contributing

This project is part of the **VTU Intern Team 8 (JAVA-2026)**. Contributions are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the VTU Intern Team
</p>
