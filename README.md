# Auth Logs - Authentication Event Monitoring

A comprehensive authentication event monitoring and analytics platform built with Next.js, Prisma, and PostgreSQL. Monitor user authentication activities across multiple applications with real-time dashboards, filtering capabilities, and Excel export functionality.

## Features

- **Real-time Event Monitoring**: Track authentication events (login, logout, password changes, etc.) across all connected applications
- **Multi-Application Support**: Monitor events from multiple applications in a single dashboard
- **Advanced Filtering**: Filter events by application, event type, and date range
- **Excel Export**: Export filtered authentication logs to Excel with Manila timezone formatting
- **Interactive Dashboard**: View event statistics, recent activity, and event type distribution
- **Webhook Integration**: Receive real-time authentication events via secure webhooks
- **User Management**: Track user activities with detailed user information
- **Responsive Design**: Modern, responsive UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk Authentication
- **Deployment**: Vercel
- **Webhooks**: Svix for webhook management

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account for authentication
- Vercel account for deployment (optional)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/NextStep-Software-Solutions-Inc/authlogger.git
   cd auth-logs
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `WEBHOOK_SECRET_AUTHLOGGER`: Webhook secret for Svix
   - Clerk authentication variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, etc.)

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses the following main entities:

- **Users**: Authentication users with profile information
- **Applications**: Registered applications that send authentication events
- **AuthEvents**: Individual authentication events (login, logout, etc.)
- **Logs**: Additional user activity logs

## API Endpoints

### Webhooks

- `POST /api/webhook/[app-name]`: Receive authentication events from applications

### Events

- `GET /api/events`: Fetch paginated events with filtering
- `GET /api/export/events`: Export events to Excel format

### Applications

- `GET /api/applications`: List all registered applications

## Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
2. **Configure environment variables** in Vercel dashboard
3. **Deploy**: Vercel will automatically build and deploy your application

### Database Setup for Production

Ensure your production database is accessible and run:

```bash
npx prisma migrate deploy
```

## Usage

### Adding Applications

1. Register your application in the Applications section
2. Configure webhooks to point to `/api/webhook/[app-name]`
3. Include the webhook secret in your application configuration

### Monitoring Events

1. Navigate to the Events page
2. Use filters to narrow down events by application, type, or date range
3. Export filtered results to Excel for further analysis

### Excel Export Features

- Exports include Event ID, Type, User details, Application, and timestamps
- Timestamps are formatted in Manila timezone (UTC+8)
- Files are named with application name and date range for easy identification

## Development

### Available Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint

### Project Structure

```
app/
├── api/                    # API routes
│   ├── export/            # Excel export endpoints
│   └── webhook/           # Webhook handlers
├── applications/          # Application management
├── events/               # Event monitoring dashboard
├── globals.css           # Global styles
├── layout.tsx           # Root layout
└── page.tsx             # Home page

prisma/
├── schema.prisma        # Database schema
└── migrations/          # Database migrations
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
