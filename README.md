# Subscription Debt Manager

Take control of your subscription spending and manage recurring payments with confidence. Subscription Debt Manager helps you track, analyze, and optimize your subscriptions to reduce monthly costs and eliminate forgotten recurring charges.

## Features

- **Real-Time Expense Tracking** - Monitor all your subscriptions in one place with detailed cost breakdowns and spending trends
- **Budget Management** - Set monthly or annual budget limits and get alerts when approaching your threshold
- **Spending Analytics** - Visualize your spending patterns with interactive charts and identify areas to cut costs
- **Subscription Management** - Easily add, edit, pause, or cancel subscriptions with an intuitive interface
- **Multi-Language Support** - Available in English, Spanish, and Telugu
- **Dark & Light Mode** - Choose your preferred theme for comfortable viewing
- **Local Backup & Restore** - Back up your subscriptions locally and restore them anytime
- **Data Security** - Your data is securely stored with Firebase authentication

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Internationalization**: react-i18next
- **Build Tool**: Vite
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/subscription-debt-manager.git
cd subscription-debt-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase configuration:
   - Create a new project in Firebase Console
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config

4. Create a `.env.local` file in the root directory:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable React components
├── pages/            # Page components
├── context/          # React Context for state management
├── utils/            # Utility functions
├── locales/          # Translation files (EN, ES, TE)
├── App.jsx           # Main application component
├── main.jsx          # Application entry point
└── index.css         # Global styles
```

## Key Components

- **SubscriptionTable** - Displays active subscriptions with edit/delete actions
- **AddSubscriptionModal** - Form for adding new subscriptions
- **AnalyticsPage** - Dashboard with spending analytics and charts
- **ProfilePage** - User account settings and security options
- **BudgetSettings** - Budget configuration and tracking
- **Footer** - About section with app information

## Usage

### Adding a Subscription

1. Click "Add Subscription" in the header
2. Fill in subscription details (name, cost, billing cycle, renewal date)
3. Optionally add a category
4. Click "Add Subscription"

### Setting a Budget

1. Click on "Budget Status" metric card
2. Enter your monthly or annual budget limit
3. The app will track your spending and alert you when approaching the limit

### Viewing Analytics

1. Navigate to the Analytics Dashboard
2. View charts for:
   - Spending by category
   - Monthly billing trends
   - Top expensive subscriptions
   - 12-month spending forecast

### Managing Account

1. Click the settings icon in the header
2. Update your email or password
3. Change theme preference (dark/light mode)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or reach out through the project repository.

## Roadmap

- Email reminders for upcoming renewals
- Subscription sharing between users
- Integration with payment systems
- Mobile app (React Native)
- Advanced analytics and insights

## Acknowledgments

Built with modern web technologies and designed for users who want to take control of their subscription expenses.
